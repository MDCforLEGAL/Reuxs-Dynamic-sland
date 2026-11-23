package com.reuxs.capsule

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.app.NotificationCompat
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Draws the ReuXs capsule over the system UI (top-center, around the front
 * camera cutout) and keeps it fed with time, battery and update state.
 */
class CapsuleOverlayService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private lateinit var windowManager: WindowManager
    private lateinit var lifecycleOwner: OverlayLifecycleOwner
    private var capsuleView: ComposeView? = null
    private var batteryReceiver: BroadcastReceiver? = null
    private var ticker: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startInForeground()

        windowManager = getSystemService(WindowManager::class.java)
        lifecycleOwner = OverlayLifecycleOwner().also { it.onCreate() }

        attachOverlay()
        registerBatteryReceiver()
        ticker = scope.launch {
            while (isActive) {
                CapsuleRuntime.tick()
                delay(250L)
            }
        }

        scope.launch {
            CapsuleRuntime.setUpdate(UpdateChecker.check(applicationContext))
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        ticker?.cancel()
        capsuleView?.let { view ->
            runCatching { windowManager.removeView(view) }
        }
        capsuleView = null
        batteryReceiver?.let { receiver ->
            runCatching { unregisterReceiver(receiver) }
        }
        batteryReceiver = null
        lifecycleOwner.onDestroy()
        scope.cancel()
        super.onDestroy()
    }

    /* ------------------------------------------------------------------ setup */

    private fun startInForeground() {
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.notification_channel_description)
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)

        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_capsule_notification)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(contentIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun attachOverlay() {
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = dp(8)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        val view = ComposeView(this).apply {
            // Compose only requires the lifecycle and saved-state owners; no
            // ViewModel is used by the overlay, so no ViewModelStoreOwner is set.
            setViewTreeLifecycleOwner(lifecycleOwner)
            setViewTreeSavedStateRegistryOwner(lifecycleOwner)
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
            setContent {
                ReuXsTheme {
                    val snapshot by CapsuleRuntime.snapshot.collectAsState()
                    CapsuleOverlay(
                        snapshot = snapshot,
                        onEvent = CapsuleRuntime::dispatch,
                        onToggleTimer = CapsuleRuntime::toggleTimer,
                        onResetTimer = CapsuleRuntime::resetTimer,
                        onSetDuration = CapsuleRuntime::setTimerDuration,
                        onSplit = { CapsuleRuntime.dispatch(CapsuleEvent.Split) },
                        onOpenUpdate = { openUrl(snapshot.update.downloadUrl) }
                    )
                }
            }
        }

        capsuleView = view
        runCatching { windowManager.addView(view, params) }
    }

    private fun registerBatteryReceiver() {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
                val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
                val charging = (intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                    ?: -1) == BatteryManager.BATTERY_STATUS_CHARGING
                if (level >= 0 && scale > 0) {
                    CapsuleRuntime.setBattery(level * 100 / scale, charging)
                }
            }
        }
        batteryReceiver = receiver
        runCatching {
            registerReceiver(receiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }
    }

    private fun openUrl(url: String) {
        if (url.isBlank()) return
        runCatching {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val CHANNEL_ID = "reuxs_capsule"
        private const val NOTIFICATION_ID = 1001
    }
}
