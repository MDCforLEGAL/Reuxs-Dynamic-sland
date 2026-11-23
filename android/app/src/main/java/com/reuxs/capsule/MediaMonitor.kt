package com.reuxs.capsule

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper

/** Snapshot of the operating system's current media session. */
data class NowPlaying(
    val title: String = "",
    val artist: String = "",
    val album: String = "",
    val playing: Boolean = false,
    val positionMs: Long = 0L,
    val durationMs: Long = 0L,
    val art: Bitmap? = null
) {
    val hasTrack: Boolean get() = title.isNotBlank()
}

/**
 * Reads the active media session (MediaSessionManager) and publishes it to
 * [CapsuleRuntime]. Requires the notification listener permission already used
 * for the pending-notification count; without it the module simply stays idle.
 */
object MediaMonitor {

    private const val POLL_MS = 1000L

    private val handler = Handler(Looper.getMainLooper())
    private var context: Context? = null
    private var controller: MediaController? = null
    private var lastArtKey: String? = null
    private var lastPalette: AlbumPalette? = null

    private val ticker = object : Runnable {
        override fun run() {
            runCatching { poll() }
            handler.postDelayed(this, POLL_MS)
        }
    }

    fun start(context: Context) {
        this.context = context.applicationContext
        handler.removeCallbacks(ticker)
        handler.post(ticker)
    }

    fun stop() {
        handler.removeCallbacks(ticker)
        controller = null
        lastArtKey = null
        lastPalette = null
        CapsuleRuntime.setNowPlaying(null, null)
    }

    /** Play / pause on the active session. */
    fun togglePlay() {
        runCatching {
            val transport = controller?.transportControls ?: return
            if (controller?.playbackState?.state == PlaybackState.STATE_PLAYING) {
                transport.pause()
            } else {
                transport.play()
            }
        }
    }

    fun skipNext() {
        runCatching { controller?.transportControls?.skipToNext() }
    }

    private fun poll() {
        val ctx = context ?: return
        val manager = ctx.getSystemService(MediaSessionManager::class.java) ?: return
        val listener = ComponentName(ctx, ReuxsNotificationListener::class.java)

        val sessions = try {
            manager.getActiveSessions(listener)
        } catch (error: SecurityException) {
            // Notification access not granted: nothing to show.
            CapsuleRuntime.setNowPlaying(null, null)
            return
        } catch (error: Exception) {
            return
        }

        if (sessions.isEmpty()) {
            controller = null
            CapsuleRuntime.setNowPlaying(null, null)
            return
        }

        val active = sessions.firstOrNull {
            it.playbackState?.state == PlaybackState.STATE_PLAYING
        } ?: sessions.first()

        controller = active
        val metadata = active.metadata
        val title = metadata?.getString(MediaMetadata.METADATA_KEY_TITLE)
            ?: metadata?.getString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE)
            ?: ""

        if (metadata == null || title.isBlank()) {
            CapsuleRuntime.setNowPlaying(null, null)
            return
        }

        val artist = metadata.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
            ?: metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)
            ?: ""
        val album = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: ""
        val duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION).coerceAtLeast(0L)
        val state = active.playbackState
        val playing = state?.state == PlaybackState.STATE_PLAYING
        val position = state?.position?.coerceAtLeast(0L) ?: 0L

        val artKey = "$title|$artist|$album|${metadata.hashCode()}"
        val art: Bitmap? = if (artKey == lastArtKey) {
            CapsuleRuntime.snapshot.value.nowPlaying?.art
        } else {
            lastArtKey = artKey
            lastPalette = null
            loadArt(metadata)
        }

        var palette = lastPalette
        if (art != null && palette == null) {
            palette = PaletteExtractor.extract(art)
            lastPalette = palette
        }

        CapsuleRuntime.setNowPlaying(
            NowPlaying(
                title = title,
                artist = artist,
                album = album,
                playing = playing,
                positionMs = position,
                durationMs = duration,
                art = art
            ),
            palette
        )
    }

    private fun loadArt(metadata: MediaMetadata?): Bitmap? {
        val raw = metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_ART)
            ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
            ?: return null
        return runCatching {
            Bitmap.createScaledBitmap(raw, 128, 128, true)
        }.getOrDefault(raw)
    }
}

/**
 * Tiny median-cut-free palette: quantises the cover to 4 bits per channel and
 * picks the most common meaningful bucket plus the most saturated one. No
 * download, no dependency, ~1 ms on a 128 px thumbnail.
 */
object PaletteExtractor {

    private const val SAMPLE = 24

    fun extract(bitmap: Bitmap): AlbumPalette? {
        val scaled = runCatching {
            Bitmap.createScaledBitmap(bitmap, SAMPLE, SAMPLE, false)
        }.getOrNull() ?: return null

        val buckets = HashMap<Int, Bucket>()
        for (y in 0 until scaled.height) {
            for (x in 0 until scaled.width) {
                val pixel = scaled.getPixel(x, y)
                val r = AndroidColor.red(pixel)
                val g = AndroidColor.green(pixel)
                val b = AndroidColor.blue(pixel)
                val max = maxOf(r, g, b) / 255f
                val min = minOf(r, g, b) / 255f
                if (max < 0.12f || max > 0.97f) continue
                val saturation = if (max == 0f) 0f else (max - min) / max
                val key = ((r shr 4) shl 8) or ((g shr 4) shl 4) or (b shr 4)
                val bucket = buckets[key]
                if (bucket == null) {
                    buckets[key] = Bucket(r, g, b, 1, saturation)
                } else {
                    bucket.count += 1
                    if (saturation > bucket.saturation) bucket.saturation = saturation
                }
            }
        }

        if (buckets.isEmpty()) return null
        val all = buckets.values
        val dominant = all.maxByOrNull { it.count * (0.35f + it.saturation) } ?: return null
        val accent = all.maxByOrNull {
            it.saturation * (kotlin.math.ln(1f + it.count) / kotlin.math.ln(2f))
        } ?: dominant

        return AlbumPalette(
            dominant = AndroidColor.rgb(dominant.r, dominant.g, dominant.b).toCompose(),
            accent = AndroidColor.rgb(accent.r, accent.g, accent.b).toCompose()
        )
    }

    private class Bucket(
        val r: Int,
        val g: Int,
        val b: Int,
        var count: Int,
        var saturation: Float
    )

    private fun Int.toCompose() = androidx.compose.ui.graphics.Color(this)
}
