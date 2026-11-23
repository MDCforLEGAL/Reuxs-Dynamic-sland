package com.reuxs.capsule

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Optional listener: with notification access granted, the capsule shows how
 * many notifications are waiting. It never reads notification content.
 */
class ReuxsNotificationListener : NotificationListenerService() {

    override fun onListenerConnected() {
        super.onListenerConnected()
        publishCount()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        publishCount()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        publishCount()
    }

    private fun publishCount() {
        val count = try {
            activeNotifications?.size ?: 0
        } catch (error: SecurityException) {
            0
        }
        CapsuleRuntime.setNotifications(count)
    }
}
