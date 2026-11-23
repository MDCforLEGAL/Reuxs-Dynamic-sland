package com.reuxs.capsule

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val MutedSurface = Color(0x73000000)

@Composable
fun CapsuleOverlay(
    snapshot: CapsuleSnapshot,
    onEvent: (CapsuleEvent) -> Unit,
    onToggleTimer: () -> Unit,
    onResetTimer: () -> Unit,
    onSetDuration: (Long) -> Unit,
    onSplit: () -> Unit,
    onOpenUpdate: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        AnimatedContent(
            targetState = snapshot.capsuleState,
            transitionSpec = {
                (
                    fadeIn(tween(180)) +
                        scaleIn(
                            initialScale = 0.94f,
                            animationSpec = spring(
                                dampingRatio = 0.72f,
                                stiffness = Spring.StiffnessMediumLow
                            )
                        )
                    ) togetherWith fadeOut(tween(120))
            },
            label = "reuxs-capsule"
        ) { state ->
            when (state) {
                CapsuleState.SPLIT_BUBBLE -> SplitRow(
                    snapshot = snapshot,
                    onMerge = { onEvent(CapsuleEvent.Merge) },
                    onToggleTimer = onToggleTimer
                )

                CapsuleState.EXPANDED -> ExpandedCard(
                    snapshot = snapshot,
                    onCollapse = { onEvent(CapsuleEvent.Collapse) },
                    onToggleTimer = onToggleTimer,
                    onResetTimer = onResetTimer,
                    onSetDuration = onSetDuration,
                    onSplit = onSplit,
                    onOpenUpdate = onOpenUpdate
                )

                else -> CompactPill(
                    snapshot = snapshot,
                    onExpand = { onEvent(CapsuleEvent.Expand) },
                    onToggleTimer = onToggleTimer
                )
            }
        }
    }
}

/* --------------------------------------------------------------- compact pill */

@Composable
private fun CompactPill(
    snapshot: CapsuleSnapshot,
    onExpand: () -> Unit,
    onToggleTimer: () -> Unit
) {
    Row(
        modifier = Modifier
            .width(268.dp)
            .height(44.dp)
            .capsuleSurface(expanded = false, cornerRadius = 22)
            .clickable { onExpand() }
            .padding(horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CapsuleGlyph(22)
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "ReuXs",
                color = ReuXsColors.TextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "MATERIAL CAPSULE",
                color = ReuXsColors.TextMuted,
                fontSize = 7.sp,
                letterSpacing = 1.4.sp
            )
        }

        Text(
            text = formatDuration(snapshot.timer.remainingMs),
            color = if (snapshot.timer.running) ReuXsColors.CrimsonSoft else ReuXsColors.TextPrimary,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier
                .clip(CircleShape)
                .clickable { onToggleTimer() }
                .padding(horizontal = 6.dp, vertical = 3.dp)
        )
        Spacer(Modifier.width(4.dp))
        Text(
            text = batteryLabel(snapshot),
            color = ReuXsColors.TextSecondary,
            fontSize = 10.sp
        )
        if (snapshot.updateAvailable) {
            Spacer(Modifier.width(4.dp))
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(ReuXsColors.Crimson)
            )
        }
        Spacer(Modifier.width(2.dp))
        Icon(
            imageVector = Icons.Filled.KeyboardArrowDown,
            contentDescription = null,
            tint = ReuXsColors.TextSecondary,
            modifier = Modifier.size(16.dp)
        )
    }
}

/* ------------------------------------------------------------ expanded card */

@Composable
private fun ExpandedCard(
    snapshot: CapsuleSnapshot,
    onCollapse: () -> Unit,
    onToggleTimer: () -> Unit,
    onResetTimer: () -> Unit,
    onSetDuration: (Long) -> Unit,
    onSplit: () -> Unit,
    onOpenUpdate: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(356.dp)
            .capsuleSurface(expanded = true, cornerRadius = 28)
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CapsuleGlyph(26)
            Spacer(Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "ReuXs",
                    color = ReuXsColors.TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "MATERIAL CAPSULE · v${BuildConfig.VERSION_NAME}",
                    color = ReuXsColors.TextMuted,
                    fontSize = 7.sp,
                    letterSpacing = 1.2.sp
                )
            }
            Text(
                text = formatClock(),
                color = ReuXsColors.TextPrimary,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.width(2.dp))
            Icon(
                imageVector = Icons.Filled.KeyboardArrowUp,
                contentDescription = "Daralt",
                tint = ReuXsColors.TextSecondary,
                modifier = Modifier
                    .size(20.dp)
                    .clip(CircleShape)
                    .clickable { onCollapse() }
            )
        }

        Spacer(Modifier.height(10.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            StatusPill()
            Spacer(Modifier.width(6.dp))
            InfoPill(text = batteryLabel(snapshot), accent = false)
            if (snapshot.notifications > 0) {
                Spacer(Modifier.width(6.dp))
                InfoPill(text = "${snapshot.notifications} bildirim", accent = false)
            }
            Spacer(Modifier.weight(1f))
            if (snapshot.update.checked && !snapshot.updateAvailable && snapshot.update.error == null) {
                Text(
                    text = "sürüm güncel",
                    color = ReuXsColors.TextMuted,
                    fontSize = 9.sp
                )
            }
        }

        Spacer(Modifier.height(10.dp))

        TimerCard(
            snapshot = snapshot,
            onToggleTimer = onToggleTimer,
            onResetTimer = onResetTimer,
            onSetDuration = onSetDuration
        )

        Spacer(Modifier.height(8.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            ActionTile(
                label = "Böl",
                onClick = onSplit,
                modifier = Modifier.weight(1f)
            )
            ActionTile(
                label = "Odak 25",
                onClick = { onSetDuration(25 * 60_000L) },
                modifier = Modifier.weight(1f)
            )
            ActionTile(
                label = "Güncelleme",
                onClick = onOpenUpdate,
                modifier = Modifier.weight(1f)
            )
        }

        if (snapshot.updateAvailable) {
            Spacer(Modifier.height(8.dp))
            UpdateBadge(update = snapshot.update, onOpenUpdate = onOpenUpdate)
        }
    }
}

@Composable
private fun TimerCard(
    snapshot: CapsuleSnapshot,
    onToggleTimer: () -> Unit,
    onResetTimer: () -> Unit,
    onSetDuration: (Long) -> Unit
) {
    val timer = snapshot.timer
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(MutedSurface)
            .border(1.dp, ReuXsColors.Border.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "HIZLI ZAMANLAYICI",
                color = ReuXsColors.TextMuted,
                fontSize = 8.sp,
                letterSpacing = 1.8.sp
            )
            Spacer(Modifier.weight(1f))
            Text(
                text = "${(timer.progress * 100).toInt()}%",
                color = ReuXsColors.TextMuted,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )
        }

        Spacer(Modifier.height(4.dp))

        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = formatDuration(timer.remainingMs),
                color = ReuXsColors.TextPrimary,
                fontSize = 30.sp,
                fontWeight = FontWeight.Light,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = if (timer.running) "ÇALIŞIYOR" else "BEKLEMEDE",
                color = if (timer.running) ReuXsColors.Crimson else ReuXsColors.TextMuted,
                fontSize = 8.sp,
                letterSpacing = 1.6.sp,
                modifier = Modifier.padding(bottom = 5.dp)
            )
        }

        Spacer(Modifier.height(8.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(CircleShape)
                .background(Color(0x26FFFFFF))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(timer.progress.coerceAtLeast(0.02f))
                    .fillMaxHeight()
                    .clip(CircleShape)
                    .background(
                        Brush.horizontalGradient(
                            listOf(ReuXsColors.BloodDeep, ReuXsColors.Crimson)
                        )
                    )
            )
        }

        Spacer(Modifier.height(10.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            TimerButton(
                label = if (timer.running) "Duraklat" else "Başlat",
                primary = true,
                onClick = onToggleTimer
            )
            Spacer(Modifier.width(6.dp))
            TimerButton(label = "Sıfırla", primary = false, onClick = onResetTimer)
            Spacer(Modifier.weight(1f))
            PresetChip("1dk") { onSetDuration(60_000L) }
            Spacer(Modifier.width(4.dp))
            PresetChip("5dk") { onSetDuration(5 * 60_000L) }
            Spacer(Modifier.width(4.dp))
            PresetChip("15dk") { onSetDuration(15 * 60_000L) }
        }
    }
}

/* --------------------------------------------------------------- split state */

@Composable
private fun SplitRow(
    snapshot: CapsuleSnapshot,
    onMerge: () -> Unit,
    onToggleTimer: () -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier
                .width(166.dp)
                .height(58.dp)
                .capsuleSurface(expanded = false, cornerRadius = 22)
                .clickable { onMerge() }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CapsuleGlyph(24)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(
                    text = formatClock(),
                    color = ReuXsColors.TextPrimary,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = batteryLabel(snapshot),
                    color = ReuXsColors.TextMuted,
                    fontSize = 9.sp
                )
            }
            Spacer(Modifier.weight(1f))
            Icon(
                imageVector = Icons.Filled.KeyboardArrowUp,
                contentDescription = "Birleştir",
                tint = ReuXsColors.TextMuted,
                modifier = Modifier.size(16.dp)
            )
        }

        Row(
            modifier = Modifier
                .width(166.dp)
                .height(58.dp)
                .capsuleSurface(expanded = false, cornerRadius = 22)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = formatDuration(snapshot.timer.remainingMs),
                    color = ReuXsColors.TextPrimary,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = if (snapshot.timer.running) "çalışıyor" else "zamanlayıcı",
                    color = ReuXsColors.TextMuted,
                    fontSize = 8.sp,
                    letterSpacing = 0.8.sp
                )
            }
            Icon(
                imageVector = if (snapshot.timer.running) Icons.Filled.Refresh else Icons.Filled.PlayArrow,
                contentDescription = "Zamanlayıcı",
                tint = ReuXsColors.Crimson,
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0x33000000))
                    .clickable { onToggleTimer() }
                    .padding(6.dp)
            )
        }
    }
}

/* -------------------------------------------------------------------- pieces */

@Composable
private fun CapsuleGlyph(size: Dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(Color(0xE6450A0A))
            .border(1.dp, ReuXsColors.Border, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .width(size * 0.58f)
                .height(size * 0.3f)
                .clip(CircleShape)
                .border(1.2.dp, ReuXsColors.Crimson, CircleShape)
                .background(Color(0x33EF4444))
        )
    }
}

@Composable
private fun StatusPill() {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(Color(0x66450A0A))
            .border(1.dp, ReuXsColors.Border, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(5.dp)
                .clip(CircleShape)
                .background(ReuXsColors.Crimson)
        )
        Spacer(Modifier.width(5.dp))
        Text(
            text = "ReuXs AKTİF",
            color = ReuXsColors.CrimsonSoft,
            fontSize = 7.5.sp,
            letterSpacing = 1.2.sp
        )
    }
}

@Composable
private fun InfoPill(text: String, accent: Boolean) {
    Text(
        text = text,
        color = if (accent) ReuXsColors.CrimsonSoft else ReuXsColors.TextSecondary,
        fontSize = 9.sp,
        modifier = Modifier
            .clip(CircleShape)
            .background(Color(0x4D000000))
            .border(1.dp, Color(0x14FFFFFF), CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}

@Composable
private fun ActionTile(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Text(
        text = label,
        color = ReuXsColors.TextSecondary,
        fontSize = 10.sp,
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0x0DFFFFFF))
            .border(1.dp, Color(0x14FFFFFF), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 9.dp),
        textAlign = androidx.compose.ui.text.style.TextAlign.Center
    )
}

@Composable
private fun TimerButton(label: String, primary: Boolean, onClick: () -> Unit) {
    Text(
        text = label,
        color = if (primary) Color.Black else ReuXsColors.TextSecondary,
        fontSize = 11.sp,
        fontWeight = if (primary) FontWeight.SemiBold else FontWeight.Normal,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (primary) ReuXsColors.Crimson else Color(0x0DFFFFFF))
            .border(1.dp, if (primary) Color.Transparent else Color(0x1FFFFFFF), CircleShape)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 7.dp)
    )
}

@Composable
private fun PresetChip(label: String, onClick: () -> Unit) {
    Text(
        text = label,
        color = ReuXsColors.TextMuted,
        fontSize = 9.sp,
        fontFamily = FontFamily.Monospace,
        modifier = Modifier
            .clip(CircleShape)
            .border(1.dp, Color(0x14FFFFFF), CircleShape)
            .clickable { onClick() }
            .padding(horizontal = 7.dp, vertical = 4.dp)
    )
}

@Composable
private fun UpdateBadge(update: UpdateInfo, onOpenUpdate: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xE6450A0A), Color(0xE62A0A0A), Color(0xCC000000))
                )
            )
            .border(1.dp, ReuXsColors.BorderStrong, RoundedCornerShape(14.dp))
            .clickable { onOpenUpdate() }
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Güncelleme Mevcut",
                color = ReuXsColors.TextPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "v${update.latestVersion ?: "?"} · indirmek için dokun",
                color = ReuXsColors.TextMuted,
                fontSize = 9.sp
            )
        }
        Icon(
            imageVector = Icons.Filled.Refresh,
            contentDescription = null,
            tint = ReuXsColors.Crimson,
            modifier = Modifier.size(16.dp)
        )
    }
}

private fun batteryLabel(snapshot: CapsuleSnapshot): String =
    snapshot.batteryPercent?.let { "$it%" } ?: "AC"
