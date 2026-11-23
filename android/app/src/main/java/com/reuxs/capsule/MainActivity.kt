package com.reuxs.capsule

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ReuXsTheme {
                HomeScreen()
            }
        }
    }

    private fun startCapsule() {
        ContextCompat.startForegroundService(
            this,
            Intent(this, CapsuleOverlayService::class.java)
        )
    }

    private fun stopCapsule() {
        stopService(Intent(this, CapsuleOverlayService::class.java))
    }

    private fun openOverlaySettings() {
        runCatching {
            startActivity(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
            )
        }
    }

    private fun openExternal(url: String) {
        if (url.isBlank()) return
        runCatching {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }

    @Composable
    private fun HomeScreen() {
        val context = LocalContext.current
        val snapshot by CapsuleRuntime.snapshot.collectAsState()
        val lifecycleOwner = LocalLifecycleOwner.current

        var overlayGranted by remember { mutableStateOf(Settings.canDrawOverlays(context)) }
        var listenerGranted by remember {
            mutableStateOf(
                NotificationManagerCompat.getEnabledListenerPackages(context)
                    .contains(context.packageName)
            )
        }
        var capsuleRunning by remember { mutableStateOf(false) }

        DisposableEffect(lifecycleOwner) {
            val observer = LifecycleEventObserver { _, event ->
                if (event == Lifecycle.Event.ON_RESUME) {
                    overlayGranted = Settings.canDrawOverlays(context)
                    listenerGranted = NotificationManagerCompat.getEnabledListenerPackages(context)
                        .contains(context.packageName)
                }
            }
            lifecycleOwner.lifecycle.addObserver(observer)
            onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
        }

        LaunchedEffect(Unit) {
            if (!snapshot.update.checked) {
                CapsuleRuntime.setUpdate(UpdateChecker.check(context))
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(reuXsBackgroundBrush())
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 24.dp)
        ) {
            Text(
                text = "ReuXs",
                color = ReuXsColors.TextPrimary,
                fontSize = 34.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "MATERIAL CAPSULE",
                color = ReuXsColors.Crimson,
                fontSize = 10.sp,
                letterSpacing = 3.sp
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = "Derin siyahtan kan kırmızısına akan, düşük kaynak tüketimli " +
                    "kapsül deneyimi. Ön kamera deliğinin etrafında yaşar.",
                color = ReuXsColors.TextSecondary,
                fontSize = 13.sp,
                lineHeight = 19.sp
            )

            Spacer(Modifier.height(20.dp))

            CapsuleOverlay(
                snapshot = snapshot,
                onEvent = CapsuleRuntime::dispatch,
                onToggleTimer = CapsuleRuntime::toggleTimer,
                onResetTimer = CapsuleRuntime::resetTimer,
                onSetDuration = CapsuleRuntime::setTimerDuration,
                onSplit = { CapsuleRuntime.dispatch(CapsuleEvent.Split) },
                onOpenUpdate = { openExternal(snapshot.update.downloadUrl) }
            )

            Spacer(Modifier.height(16.dp))

            PermissionCard(
                title = "Ekran üstü kapsül",
                body = "Kapsülün sistem arayüzünün üzerinde çizilmesi için izin gerekir.",
                granted = overlayGranted,
                actionLabel = if (overlayGranted) "Açık" else "İzin ver",
                onAction = { openOverlaySettings() }
            )

            Spacer(Modifier.height(10.dp))

            PermissionCard(
                title = "Bildirim erişimi",
                body = "Bekleyen bildirim sayısını kapsülde göstermek için isteğe bağlıdır.",
                granted = listenerGranted,
                actionLabel = if (listenerGranted) "Açık" else "Ayarlar",
                onAction = {
                    runCatching {
                        startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                    }
                }
            )

            Spacer(Modifier.height(18.dp))

            Button(
                onClick = {
                    when {
                        !overlayGranted -> openOverlaySettings()
                        capsuleRunning -> {
                            stopCapsule()
                            capsuleRunning = false
                        }

                        else -> {
                            startCapsule()
                            capsuleRunning = true
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (capsuleRunning) ReuXsColors.Blood else ReuXsColors.Crimson,
                    contentColor = if (capsuleRunning) ReuXsColors.TextPrimary else Color.Black
                )
            ) {
                Text(
                    text = when {
                        !overlayGranted -> "Önce ekran üstü iznini ver"
                        capsuleRunning -> "Kapsülü durdur"
                        else -> "Kapsülü başlat"
                    },
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
            }

            Spacer(Modifier.height(12.dp))

            Text(
                text = "v${BuildConfig.VERSION_NAME} · MIT lisanslı · veri toplamaz",
                color = ReuXsColors.TextMuted,
                fontSize = 9.sp,
                letterSpacing = 0.8.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }

    @Composable
    private fun PermissionCard(
        title: String,
        body: String,
        granted: Boolean,
        actionLabel: String,
        onAction: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0x66140505))
                .border(1.dp, ReuXsColors.Border, RoundedCornerShape(18.dp))
                .padding(14.dp)
        ) {
            Row {
                Text(
                    text = title,
                    color = ReuXsColors.TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = if (granted) "AKTİF" else "GEREKLİ",
                    color = if (granted) ReuXsColors.CrimsonSoft else ReuXsColors.TextMuted,
                    fontSize = 8.sp,
                    letterSpacing = 1.2.sp
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = body,
                color = ReuXsColors.TextSecondary,
                fontSize = 11.sp,
                lineHeight = 16.sp
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = actionLabel,
                color = ReuXsColors.Crimson,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .border(1.dp, ReuXsColors.Border, RoundedCornerShape(999.dp))
                    .clickable { onAction() }
                    .padding(horizontal = 14.dp, vertical = 7.dp)
            )
        }
    }
}
