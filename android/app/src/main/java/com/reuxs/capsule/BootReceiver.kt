package com.reuxs.capsule

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.content.ContextCompat

/**
 * Restarts the capsule after a reboot when the user enabled
 * "Başlangıçta otomatik çalıştır" in the control panel. Nothing is started
 * without the overlay permission, so a fresh install stays silent.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val bootIntent = intent ?: return
        if (bootIntent.action != Intent.ACTION_BOOT_COMPLETED) return
        if (bootIntent.`package` != null && context.packageName != bootIntent.`package`) return

        SettingsStore.init(context)
        if (!SettingsStore.settings.value.autostart) return
        if (!Settings.canDrawOverlays(context)) return

        runCatching {
            ContextCompat.startForegroundService(
                context,
                Intent(context, CapsuleOverlayService::class.java)
            )
        }
    }
}
