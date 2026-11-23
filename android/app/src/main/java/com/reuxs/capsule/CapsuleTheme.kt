package com.reuxs.capsule

import androidx.compose.foundation.border
import androidx.compose.foundation.background
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

/** Deep obsidian → blood red gradient used by every ReuXs surface. */
fun reuXsBackgroundBrush(): Brush = Brush.linearGradient(
    colors = listOf(ReuXsColors.Blood, ReuXsColors.BloodDeep, Color(0xFF180505), ReuXsColors.Obsidian),
    start = Offset.Zero,
    end = Offset.Infinite
)

/**
 * Capsule surface: translucent crimson border, gradient fill and a soft red
 * ambient glow when the capsule is expanded.
 */
fun Modifier.capsuleSurface(expanded: Boolean, cornerRadius: Int = 28): Modifier = this
    .shadow(
        elevation = if (expanded) 26.dp else 12.dp,
        shape = RoundedCornerShape(cornerRadius.dp),
        ambientColor = ReuXsColors.Glow,
        spotColor = ReuXsColors.Crimson
    )
    .clip(RoundedCornerShape(cornerRadius.dp))
    .background(reuXsBackgroundBrush())
    .border(
        width = 1.dp,
        color = if (expanded) ReuXsColors.BorderStrong else ReuXsColors.Border,
        shape = RoundedCornerShape(cornerRadius.dp)
    )
