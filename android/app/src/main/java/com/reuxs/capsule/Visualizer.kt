package com.reuxs.capsule

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.sin

/**
 * Rhythm-reactive-looking visualizer. System media sessions do not expose raw
 * audio, so bars are driven by a single shared sine phase: smooth, cheap (one
 * animation, no allocations per frame) and it stops entirely when the capsule
 * is idle.
 */
@Composable
fun MusicVisualizer(
    active: Boolean,
    style: VisualizerStyle,
    color: Color,
    modifier: Modifier = Modifier,
    bars: Int = 5
) {
    val transition = rememberInfiniteTransition(label = "reuxs-visualizer")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = (2 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400, easing = LinearEasing)
        ),
        label = "reuxs-visualizer-phase"
    )

    Canvas(modifier = modifier.size(width = (bars * 4).dp, height = 16.dp)) {
        val step = size.width / bars
        val barWidth = (step * 0.45f).coerceAtLeast(1.5f)

        repeat(bars) { index ->
            val wave = sin(phase + index * 0.85f)
            val level = if (active) 0.32f + 0.68f * abs(wave) else 0.2f
            val height = (size.height * level).coerceAtLeast(2f)
            val alpha = if (active) 0.95f else 0.32f
            val centerX = step * index + step / 2f

            if (style == VisualizerStyle.WAVE) {
                drawCircle(
                    color = color.copy(alpha = alpha),
                    radius = barWidth * 0.62f,
                    center = Offset(centerX, size.height - height / 2f)
                )
            } else {
                drawRoundRect(
                    color = color.copy(alpha = alpha),
                    topLeft = Offset(centerX - barWidth / 2f, size.height - height),
                    size = Size(barWidth, height),
                    cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
                )
            }
        }
    }
}
