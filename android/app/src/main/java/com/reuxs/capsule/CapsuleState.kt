package com.reuxs.capsule

import android.os.SystemClock

/** Mirrors core/src/capsule.ts. */
enum class CapsuleState {
    IDLE,
    COMPACT,
    EXPANDED,
    SPLIT_BUBBLE;

    fun reduce(event: CapsuleEvent): CapsuleState = when (event) {
        CapsuleEvent.Activate, CapsuleEvent.Expand -> if (this == IDLE) COMPACT else EXPANDED
        CapsuleEvent.Collapse -> if (this == IDLE) IDLE else COMPACT
        CapsuleEvent.Split -> if (this == IDLE) COMPACT else SPLIT_BUBBLE
        CapsuleEvent.Merge -> COMPACT
        CapsuleEvent.Dismiss -> IDLE
    }
}

sealed interface CapsuleEvent {
    data object Activate : CapsuleEvent
    data object Expand : CapsuleEvent
    data object Collapse : CapsuleEvent
    data object Split : CapsuleEvent
    data object Merge : CapsuleEvent
    data object Dismiss : CapsuleEvent
}

/** Timestamp based timer; the 250 ms overlay tick can never make it drift. */
data class TimerState(
    val durationMs: Long = 60_000L,
    val remainingMs: Long = 60_000L,
    val running: Boolean = false,
    val startedAt: Long? = null
) {
    fun remaining(now: Long = SystemClock.elapsedRealtime()): Long =
        if (!running || startedAt == null) remainingMs.coerceAtLeast(0L)
        else (remainingMs - (now - startedAt)).coerceAtLeast(0L)

    fun started(now: Long = SystemClock.elapsedRealtime()): TimerState =
        if (running) this
        else copy(
            remainingMs = if (remainingMs <= 0L) durationMs else remainingMs,
            running = true,
            startedAt = now
        )

    fun paused(now: Long = SystemClock.elapsedRealtime()): TimerState =
        if (!running) this else copy(remainingMs = remaining(now), running = false, startedAt = null)

    fun toggled(now: Long = SystemClock.elapsedRealtime()): TimerState =
        if (running) paused(now) else started(now)

    fun reset(): TimerState = copy(remainingMs = durationMs, running = false, startedAt = null)

    fun withDuration(duration: Long): TimerState = TimerState(durationMs = duration, remainingMs = duration)

    val progress: Float
        get() = if (durationMs <= 0L) 0f
        else (1f - remainingMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f)
}

data class CapsuleSnapshot(
    val capsuleState: CapsuleState = CapsuleState.COMPACT,
    val timer: TimerState = TimerState(),
    val batteryPercent: Int? = null,
    val charging: Boolean = false,
    val notifications: Int = 0,
    val update: UpdateInfo = UpdateInfo(),
    val nowPlaying: NowPlaying? = null,
    val palette: AlbumPalette? = null
) {
    val updateAvailable: Boolean get() = update.available
    val hasMusic: Boolean get() = nowPlaying?.hasTrack == true
}

fun formatDuration(ms: Long): String {
    val totalSeconds = (ms.coerceAtLeast(0L) + 999L) / 1000L
    val hours = totalSeconds / 3600L
    val minutes = (totalSeconds % 3600L) / 60L
    val seconds = totalSeconds % 60L
    return if (hours > 0L) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%02d:%02d".format(minutes, seconds)
    }
}

fun formatClock(): String {
    val calendar = java.util.Calendar.getInstance()
    return "%02d:%02d".format(calendar.get(java.util.Calendar.HOUR_OF_DAY), calendar.get(java.util.Calendar.MINUTE))
}
