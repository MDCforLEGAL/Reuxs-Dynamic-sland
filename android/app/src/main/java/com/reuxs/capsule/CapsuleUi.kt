package com.reuxs.capsule

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val MutedSurface = Color(0x73000000)

/**
 * The capsule itself: information and quick controls only. Every setting lives
 * in the independent control panel ([MainActivity]), never in here.
 */
@Composable
fun CapsuleOverlay(
    snapshot: CapsuleSnapshot,
    settings: ReuxsSettings,
    onEvent: (CapsuleEvent) -> Unit,
    onToggleTimer: () -> Unit,
    onResetTimer: () -> Unit,
    onSetDuration: (Long) -> Unit,
    onSplit: () -> Unit,
    onOpenUpdate: () -> Unit,
    onTogglePlay: () -> Unit,
    modifier: Modifier = Modifier
) {
    val appearance = capsuleAppearance(
        settings,
        if (settings.adaptivePalette) snapshot.palette else null
    )
    val track = if (settings.musicEnabled) snapshot.nowPlaying?.takeIf { it.hasTrack } else null

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
                    settings = settings,
                    appearance = appearance,
                    onMerge = { onEvent(CapsuleEvent.Merge) },
                    onToggleTimer = onToggleTimer
                )

                CapsuleState.EXPANDED -> ExpandedCard(
                    snapshot = snapshot,
                    settings = settings,
                    appearance = appearance,
                    track = track,
                    onCollapse = { onEvent(CapsuleEvent.Collapse) },
                    onToggleTimer = onToggleTimer,
                    onResetTimer = onResetTimer,
                    onSetDuration = onSetDuration,
                    onSplit = onSplit,
                    onOpenUpdate = onOpenUpdate,
                    onTogglePlay = onTogglePlay
                )

                else -> CompactPill(
                    snapshot = snapshot,
                    settings = settings,
                    appearance = appearance,
                    track = track,
                    onExpand = { onEvent(CapsuleEvent.Expand) },
                    onToggleTimer = onToggleTimer,
                    onTogglePlay = onTogglePlay
                )
            }
        }
    }
}

/* --------------------------------------------------------------- compact pill */

@Composable
private fun CompactPill(
    snapshot: CapsuleSnapshot,
    settings: ReuxsSettings,
    appearance: CapsuleAppearance,
    track: NowPlaying?,
    onExpand: () -> Unit,
    onToggleTimer: () -> Unit,
    onTogglePlay: () -> Unit
) {
    Row(
        modifier = Modifier
            .width(if (track != null) 300.dp else 268.dp)
            .height(44.dp)
            .capsuleSurface(expanded = false, appearance = appearance, settings = settings)
            .clickable { onExpand() }
            .padding(horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AlbumThumb(track, appearance, size = 22.dp)

        Spacer(Modifier.width(8.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track?.title ?: "ReuXs",
                color = ReuXsColors.TextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
            Text(
                text = (track?.artist?.takeIf { it.isNotBlank() } ?: "MATERIAL CAPSULE")
                    .uppercase(),
                color = ReuXsColors.TextMuted,
                fontSize = 7.sp,
                letterSpacing = 1.2.sp,
                maxLines = 1
            )
        }

        if (track != null && settings.visualizer) {
            MusicVisualizer(
                active = track.playing,
                style = settings.visualizerStyle,
                color = appearance.accent,
                bars = 4
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = if (track.playing) "❚❚" else "▶",
                color = appearance.accentSoft,
                fontSize = 9.sp,
                modifier = Modifier
                    .clip(CircleShape)
                    .clickable { onTogglePlay() }
                    .padding(horizontal = 4.dp, vertical = 4.dp)
            )
            Spacer(Modifier.width(2.dp))
        }

        Text(
            text = formatDuration(snapshot.timer.remainingMs),
            color = if (snapshot.timer.running) appearance.accentSoft else ReuXsColors.TextPrimary,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier
                .clip(CircleShape)
                .clickable { onToggleTimer() }
                .padding(horizontal = 5.dp, vertical = 3.dp)
        )

        if (track == null) {
            Spacer(Modifier.width(3.dp))
            Text(
                text = batteryLabel(snapshot),
                color = ReuXsColors.TextSecondary,
                fontSize = 10.sp
            )
        }

        if (snapshot.updateAvailable) {
            Spacer(Modifier.width(4.dp))
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(appearance.accent)
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
    settings: ReuxsSettings,
    appearance: CapsuleAppearance,
    track: NowPlaying?,
    onCollapse: () -> Unit,
    onToggleTimer: () -> Unit,
    onResetTimer: () -> Unit,
    onSetDuration: (Long) -> Unit,
    onSplit: () -> Unit,
    onOpenUpdate: () -> Unit,
    onTogglePlay: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(356.dp)
            .capsuleSurface(expanded = true, appearance = appearance, settings = settings)
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CapsuleGlyph(26.dp, appearance)
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
            StatusPill(appearance)
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

        if (settings.musicEnabled) {
            Spacer(Modifier.height(8.dp))
            MusicCard(
                track = track,
                settings = settings,
                appearance = appearance,
                onTogglePlay = onTogglePlay
            )
        }

        Spacer(Modifier.height(8.dp))

        TimerCard(
            snapshot = snapshot,
            appearance = appearance,
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
            UpdateBadge(update = snapshot.update, appearance = appearance, onOpenUpdate = onOpenUpdate)
        }
    }
}

/* ------------------------------------------------------------- music module */

@Composable
private fun MusicCard(
    track: NowPlaying?,
    settings: ReuxsSettings,
    appearance: CapsuleAppearance,
    onTogglePlay: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x59000000))
            .border(1.dp, Color(0x14FFFFFF), RoundedCornerShape(16.dp))
            .padding(10.dp)
    ) {
        if (track == null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(9.dp))
                        .background(Color(0x14FFFFFF)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("♪", color = ReuXsColors.TextMuted, fontSize = 13.sp)
                }
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Müzik bekleniyor",
                        color = ReuXsColors.TextSecondary,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Herhangi bir oynatıcıda şarkı başlat",
                        color = ReuXsColors.TextMuted,
                        fontSize = 8.5.sp
                    )
                }
            }
            return@Column
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            AlbumThumb(track, appearance, size = 34.dp)
            Spacer(Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = track.title,
                    color = ReuXsColors.TextPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1
                )
                Text(
                    text = track.artist.ifBlank { "Bilinmeyen sanatçı" },
                    color = ReuXsColors.TextSecondary,
                    fontSize = 9.sp,
                    maxLines = 1
                )
            }

            if (settings.visualizer) {
                MusicVisualizer(
                    active = track.playing,
                    style = settings.visualizerStyle,
                    color = appearance.accent,
                    bars = 5
                )
                Spacer(Modifier.width(6.dp))
            }

            Text(
                text = if (track.playing) "❚❚" else "▶",
                color = Color.Black,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(appearance.accent)
                    .clickable { onTogglePlay() }
                    .padding(horizontal = 9.dp, vertical = 7.dp)
            )
        }

        Spacer(Modifier.height(8.dp))

        val progress = if (track.durationMs > 0L) {
            (track.positionMs.toFloat() / track.durationMs.toFloat()).coerceIn(0f, 1f)
        } else {
            0f
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = formatDuration(track.positionMs),
                color = ReuXsColors.TextMuted,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.width(6.dp))
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(3.dp)
                    .clip(CircleShape)
                    .background(Color(0x26FFFFFF))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.coerceAtLeast(0.01f))
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .background(appearance.accent)
                )
            }
            Spacer(Modifier.width(6.dp))
            Text(
                text = if (track.durationMs > 0L) formatDuration(track.durationMs) else "--:--",
                color = ReuXsColors.TextMuted,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
private fun AlbumThumb(track: NowPlaying?, appearance: CapsuleAppearance, size: Dp) {
    val art = track?.art
    if (art != null) {
        Image(
            bitmap = art.asImageBitmap(),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .border(1.dp, appearance.border, CircleShape)
        )
    } else if (track != null) {
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(Color(0xE6450A0A))
                .border(1.dp, appearance.border, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("♪", color = appearance.accent, fontSize = 9.sp)
        }
    } else {
        CapsuleGlyph(size, appearance)
    }
}

/* ---------------------------------------------------------------- timer card */

@Composable
private fun TimerCard(
    snapshot: CapsuleSnapshot,
    appearance: CapsuleAppearance,
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
            .border(1.dp, appearance.border.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
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
                color = if (timer.running) appearance.accent else ReuXsColors.TextMuted,
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
                            listOf(appearance.accent.copy(alpha = 0.55f), appearance.accent)
                        )
                    )
            )
        }

        Spacer(Modifier.height(10.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            TimerButton(
                label = if (timer.running) "Duraklat" else "Başlat",
                primary = true,
                accent = appearance.accent,
                onClick = onToggleTimer
            )
            Spacer(Modifier.width(6.dp))
            TimerButton(
                label = "Sıfırla",
                primary = false,
                accent = appearance.accent,
                onClick = onResetTimer
            )
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
    settings: ReuxsSettings,
    appearance: CapsuleAppearance,
    onMerge: () -> Unit,
    onToggleTimer: () -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier
                .width(166.dp)
                .height(58.dp)
                .capsuleSurface(expanded = false, appearance = appearance, settings = settings)
                .clickable { onMerge() }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CapsuleGlyph(24.dp, appearance)
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
                .capsuleSurface(expanded = false, appearance = appearance, settings = settings)
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
                tint = appearance.accent,
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
private fun CapsuleGlyph(size: Dp, appearance: CapsuleAppearance) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(Color(0xE6450A0A))
            .border(1.dp, appearance.border, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .width(size * 0.58f)
                .height(size * 0.3f)
                .clip(CircleShape)
                .border(1.2.dp, appearance.accent, CircleShape)
                .background(appearance.accent.copy(alpha = 0.2f))
        )
    }
}

@Composable
private fun StatusPill(appearance: CapsuleAppearance) {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(Color(0x66450A0A))
            .border(1.dp, appearance.border, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(5.dp)
                .clip(CircleShape)
                .background(appearance.accent)
        )
        Spacer(Modifier.width(5.dp))
        Text(
            text = "ReuXs AKTİF",
            color = appearance.accentSoft,
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
private fun TimerButton(
    label: String,
    primary: Boolean,
    accent: Color,
    onClick: () -> Unit
) {
    Text(
        text = label,
        color = if (primary) Color.Black else ReuXsColors.TextSecondary,
        fontSize = 11.sp,
        fontWeight = if (primary) FontWeight.SemiBold else FontWeight.Normal,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (primary) accent else Color(0x0DFFFFFF))
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
private fun UpdateBadge(
    update: UpdateInfo,
    appearance: CapsuleAppearance,
    onOpenUpdate: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xE6450A0A), Color(0xE62A0A0A), Color(0xCC000000))
                )
            )
            .border(1.dp, appearance.border.copy(alpha = 0.9f), RoundedCornerShape(14.dp))
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
            tint = appearance.accent,
            modifier = Modifier.size(16.dp)
        )
    }
}

private fun batteryLabel(snapshot: CapsuleSnapshot): String =
    snapshot.batteryPercent?.let { "$it%" } ?: "AC"
