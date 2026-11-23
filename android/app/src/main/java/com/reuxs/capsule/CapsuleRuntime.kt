package com.reuxs.capsule

import android.os.SystemClock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/** Single low-cost state holder shared by every ReuXs surface. */
object CapsuleRuntime {

    private val _snapshot = MutableStateFlow(CapsuleSnapshot())
    val snapshot: StateFlow<CapsuleSnapshot> = _snapshot.asStateFlow()

    fun dispatch(event: CapsuleEvent) {
        _snapshot.update { current -> current.copy(capsuleState = current.capsuleState.reduce(event)) }
    }

    fun toggleTimer(now: Long = SystemClock.elapsedRealtime()) {
        _snapshot.update { current -> current.copy(timer = current.timer.toggled(now)) }
    }

    fun resetTimer() {
        _snapshot.update { current -> current.copy(timer = current.timer.reset()) }
    }

    fun setTimerDuration(durationMs: Long) {
        _snapshot.update { current -> current.copy(timer = current.timer.withDuration(durationMs)) }
    }

    fun setBattery(percent: Int?, charging: Boolean) {
        _snapshot.update { current -> current.copy(batteryPercent = percent, charging = charging) }
    }

    fun setNotifications(count: Int) {
        _snapshot.update { current -> current.copy(notifications = count.coerceAtLeast(0)) }
    }

    fun setUpdate(update: UpdateInfo) {
        _snapshot.update { current -> current.copy(update = update) }
    }

    /** Live media session state; null clears the music module. */
    fun setNowPlaying(track: NowPlaying?, palette: AlbumPalette?) {
        _snapshot.update { current -> current.copy(nowPlaying = track, palette = palette) }
    }

    /** Called by the overlay ticker; keeps remaining time truthful. */
    fun tick(now: Long = SystemClock.elapsedRealtime()) {
        _snapshot.update { current ->
            val timer = current.timer
            if (!timer.running) {
                current
            } else {
                val remaining = timer.remaining(now)
                current.copy(
                    timer = timer.copy(
                        remainingMs = remaining,
                        running = remaining > 0L,
                        startedAt = if (remaining > 0L) timer.startedAt else null
                    )
                )
            }
        }
    }
}
