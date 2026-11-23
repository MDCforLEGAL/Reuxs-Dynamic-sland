package com.reuxs.capsule

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** "Crimson & Obsidian" tokens — mirrors core/src/theme.ts. */
object ReuXsColors {
    val Obsidian = Color(0xFF000000)
    val ObsidianSoft = Color(0xFF09090B)
    val BloodDeep = Color(0xFF450A0A)
    val Blood = Color(0xFF7F1D1D)
    val Imperial = Color(0xFF7F1D1D)
    val Crimson = Color(0xFFEF4444)
    val CrimsonSoft = Color(0xFFF87171)
    val TextPrimary = Color(0xFFFAFAFA)
    val TextSecondary = Color(0xFFA1A1AA)
    val TextMuted = Color(0xFF71717A)
    val Border = Color(0x59DC2626)      // rgba(220, 38, 38, 0.35)
    val BorderStrong = Color(0x8CF87171)
    val Glow = Color(0x59EF4444)
}

/**
 * Resolved capsule colours. Produced by [capsuleAppearance] from the user's
 * theme mode plus (optionally) the album cover palette.
 */
data class CapsuleAppearance(
    val gradient: List<Color>,
    val expandedGradient: List<Color>,
    val border: Color,
    val accent: Color,
    val accentSoft: Color,
    val glow: Color
)

fun mixColor(from: Color, to: Color, weight: Float): Color {
    val w = weight.coerceIn(0f, 1f)
    return Color(
        red = from.red + (to.red - from.red) * w,
        green = from.green + (to.green - from.green) * w,
        blue = from.blue + (to.blue - from.blue) * w,
        alpha = from.alpha + (to.alpha - from.alpha) * w
    )
}

/**
 * Mirrors `capsuleAppearance()` in core/src/settings.ts so both platforms
 * resolve the same colours from the same settings.
 */
fun capsuleAppearance(settings: ReuxsSettings, palette: AlbumPalette?): CapsuleAppearance {
    if (settings.themeMode == ThemeMode.OLED) {
        return CapsuleAppearance(
            gradient = listOf(Color(0xFF141414), Color(0xFF0A0A0A), Color(0xFF050505), Color.Black),
            expandedGradient = listOf(
                Color(0xFF202020), Color(0xFF0E0E0E), Color(0xFF050505), Color.Black
            ),
            border = Color(0x24FFFFFF),
            accent = Color(0xFFE4E4E7),
            accentSoft = Color(0xFFA1A1AA),
            glow = Color(0x2EFFFFFF)
        )
    }

    val album = if (settings.themeMode == ThemeMode.ALBUM) palette else null
    val accent = when {
        album != null -> album.accent
        settings.themeMode == ThemeMode.CUSTOM -> settings.accentColor
        else -> ReuXsColors.Crimson
    }
    val base = album?.dominant ?: accent

    return CapsuleAppearance(
        gradient = listOf(
            mixColor(base, Color.Black, 0.4f),
            mixColor(base, Color.Black, 0.55f),
            mixColor(base, Color.Black, 0.72f),
            Color.Black
        ),
        expandedGradient = listOf(
            mixColor(base, Color.Black, 0.45f),
            mixColor(base, Color.Black, 0.68f),
            Color(0xFF09090B),
            Color.Black
        ),
        border = accent.copy(alpha = 0.35f),
        accent = accent,
        accentSoft = mixColor(accent, Color.White, 0.3f),
        glow = accent.copy(alpha = 0.35f)
    )
}

private val ReuXsColorScheme = darkColorScheme(
    primary = ReuXsColors.Crimson,
    onPrimary = Color.Black,
    secondary = ReuXsColors.Blood,
    background = ReuXsColors.Obsidian,
    onBackground = ReuXsColors.TextPrimary,
    surface = ReuXsColors.ObsidianSoft,
    onSurface = ReuXsColors.TextPrimary,
    outline = ReuXsColors.Border
)

private val ReuXsTypography = androidx.compose.material3.Typography(
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        letterSpacing = 0.2.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontSize = 13.sp,
        color = ReuXsColors.TextSecondary
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontSize = 9.sp,
        letterSpacing = 1.6.sp,
        fontWeight = FontWeight.Medium
    )
)

@Composable
fun ReuXsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ReuXsColorScheme,
        typography = ReuXsTypography,
        content = content
    )
}

/** Deep obsidian → blood red gradient used by the control panel surfaces. */
fun reuXsBackgroundBrush(): Brush = Brush.linearGradient(
    colors = listOf(ReuXsColors.Blood, ReuXsColors.BloodDeep, Color(0xFF180505), ReuXsColors.Obsidian),
    start = Offset.Zero,
    end = Offset.Infinite
)

/**
 * Capsule surface: gradient from the resolved appearance, translucent crimson
 * border and a soft ambient glow whose strength follows the settings slider.
 * The background alpha is the user's opacity, so text stays fully readable.
 */
fun Modifier.capsuleSurface(
    expanded: Boolean,
    appearance: CapsuleAppearance,
    settings: ReuxsSettings
): Modifier {
    val radius = settings.radius
    val shape = RoundedCornerShape(radius.dp)
    val glow = settings.glow.coerceIn(0, 100) / 100f
    val colors = (if (expanded) appearance.expandedGradient else appearance.gradient)
        .map { it.copy(alpha = it.alpha * settings.opacity) }

    return this
        .shadow(
            elevation = (if (expanded) 26.dp else 12.dp) + (glow * 10).dp,
            shape = shape,
            ambientColor = appearance.glow,
            spotColor = appearance.accent
        )
        .clip(shape)
        .background(Brush.linearGradient(colors = colors, start = Offset.Zero, end = Offset.Infinite))
        .border(
            width = 1.dp,
            color = if (expanded) appearance.border.copy(alpha = 0.85f) else appearance.border,
            shape = shape
        )
}
