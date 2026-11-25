package com.reuxs.capsule

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Mirrors `core/src/settings.ts` (THEME_MODES / VISUALIZER_STYLES). */
enum class ThemeMode { CRIMSON, OLED, CUSTOM, ALBUM }

enum class VisualizerStyle { BARS, WAVE }

data class AlbumPalette(val dominant: Color, val accent: Color)

/** Which modules the capsule shows when it is tapped open. */
data class CapsulePanels(
    val music: Boolean = true,
    val timer: Boolean = true,
    val actions: Boolean = true
)

/**
 * Every customisation the control panel owns. The overlay reads the same
 * instance, so a change is visible on the capsule immediately.
 */
data class ReuxsSettings(
    val offsetX: Int = 0,
    val offsetY: Int = 0,
    val scale: Float = 1f,
    val opacity: Float = 0.86f,
    val blur: Float = 18f,
    val themeMode: ThemeMode = ThemeMode.CRIMSON,
    val customAccent: Long = 0xFFEF4444,
    val glow: Int = 55,
    val radius: Int = 26,
    val musicEnabled: Boolean = true,
    val adaptivePalette: Boolean = true,
    val visualizer: Boolean = true,
    val visualizerStyle: VisualizerStyle = VisualizerStyle.BARS,
    val autostart: Boolean = false,
    val capsuleHidden: Boolean = false,
    val capsulePanels: CapsulePanels = CapsulePanels(),
    val startOnPermission: Boolean = true
) {
    /** Guards against values that would push the capsule off screen. */
    fun normalized(): ReuxsSettings = copy(
        offsetX = offsetX.coerceIn(-600, 600),
        offsetY = offsetY.coerceIn(-200, 900),
        scale = scale.coerceIn(0.75f, 1.35f),
        opacity = opacity.coerceIn(0.35f, 1f),
        blur = blur.coerceIn(0f, 28f),
        glow = glow.coerceIn(0, 100),
        radius = radius.coerceIn(8, 34)
    )

    val accentColor: Color get() = Color(customAccent)
}

/**
 * SharedPreferences backed repository (no secrets, no network). Android keeps
 * settings here instead of DataStore so the overlay service can read them
 * synchronously during window setup.
 */
object SettingsStore {

    private const val PREFS = "reuxs_settings"

    private var prefs: SharedPreferences? = null
    private val _settings = MutableStateFlow(ReuxsSettings())
    val settings: StateFlow<ReuxsSettings> = _settings.asStateFlow()

    fun init(context: Context) {
        if (prefs != null) return
        val store = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs = store
        _settings.value = read(store)
    }

    fun update(transform: (ReuxsSettings) -> ReuxsSettings) {
        val next = transform(_settings.value).normalized()
        write(next)
        _settings.value = next
    }

    fun reset() {
        val next = ReuxsSettings()
        write(next)
        _settings.value = next
    }

    private fun read(store: SharedPreferences): ReuxsSettings {
        val defaults = ReuxsSettings()
        return ReuxsSettings(
            offsetX = store.getInt("offsetX", defaults.offsetX),
            offsetY = store.getInt("offsetY", defaults.offsetY),
            scale = store.getFloat("scale", defaults.scale),
            opacity = store.getFloat("opacity", defaults.opacity),
            blur = store.getFloat("blur", defaults.blur),
            themeMode = runCatching {
                ThemeMode.valueOf(store.getString("themeMode", defaults.themeMode.name)!!)
            }.getOrDefault(defaults.themeMode),
            customAccent = store.getLong("customAccent", defaults.customAccent),
            glow = store.getInt("glow", defaults.glow),
            radius = store.getInt("radius", defaults.radius),
            musicEnabled = store.getBoolean("musicEnabled", defaults.musicEnabled),
            adaptivePalette = store.getBoolean("adaptivePalette", defaults.adaptivePalette),
            visualizer = store.getBoolean("visualizer", defaults.visualizer),
            visualizerStyle = runCatching {
                VisualizerStyle.valueOf(
                    store.getString("visualizerStyle", defaults.visualizerStyle.name)!!
                )
            }.getOrDefault(defaults.visualizerStyle),
            autostart = store.getBoolean("autostart", defaults.autostart),
            capsuleHidden = store.getBoolean("capsuleHidden", defaults.capsuleHidden),
            capsulePanels = CapsulePanels(
                music = store.getBoolean("panelMusic", defaults.capsulePanels.music),
                timer = store.getBoolean("panelTimer", defaults.capsulePanels.timer),
                actions = store.getBoolean("panelActions", defaults.capsulePanels.actions)
            ),
            startOnPermission = store.getBoolean("startOnPermission", defaults.startOnPermission)
        ).normalized()
    }

    private fun write(settings: ReuxsSettings) {
        prefs?.edit()
            ?.putInt("offsetX", settings.offsetX)
            ?.putInt("offsetY", settings.offsetY)
            ?.putFloat("scale", settings.scale)
            ?.putFloat("opacity", settings.opacity)
            ?.putFloat("blur", settings.blur)
            ?.putString("themeMode", settings.themeMode.name)
            ?.putLong("customAccent", settings.customAccent)
            ?.putInt("glow", settings.glow)
            ?.putInt("radius", settings.radius)
            ?.putBoolean("musicEnabled", settings.musicEnabled)
            ?.putBoolean("adaptivePalette", settings.adaptivePalette)
            ?.putBoolean("visualizer", settings.visualizer)
            ?.putString("visualizerStyle", settings.visualizerStyle.name)
            ?.putBoolean("autostart", settings.autostart)
            ?.putBoolean("capsuleHidden", settings.capsuleHidden)
            ?.putBoolean("panelMusic", settings.capsulePanels.music)
            ?.putBoolean("panelTimer", settings.capsulePanels.timer)
            ?.putBoolean("panelActions", settings.capsulePanels.actions)
            ?.putBoolean("startOnPermission", settings.startOnPermission)
            ?.apply()
    }
}
