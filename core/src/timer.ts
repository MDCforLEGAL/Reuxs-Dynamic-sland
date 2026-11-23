/** Timestamp based timer so a 250 ms UI tick can never drift. */

export interface TimerState {
  /** Total length of the timer in milliseconds. */
  durationMs: number;
  /** Remaining milliseconds at the last tick. */
  remainingMs: number;
  running: boolean;
  /** Epoch milliseconds when the current run started, null when paused. */
  startedAt?: number | null;
}

export const TIMER_PRESETS = [30_000, 60_000, 5 * 60_000, 15 * 60_000] as const;

export function createTimer(durationMs = 60_000): TimerState {
  return { durationMs, remainingMs: durationMs, running: false, startedAt: null };
}

export function startTimer(timer: TimerState, now: number = Date.now()): TimerState {
  if (timer.running) return timer;
  const remaining = timer.remainingMs <= 0 ? timer.durationMs : timer.remainingMs;
  return { ...timer, remainingMs: remaining, running: true, startedAt: now };
}

export function pauseTimer(timer: TimerState, now: number = Date.now()): TimerState {
  if (!timer.running) return timer;
  return { ...timer, remainingMs: tickRemaining(timer, now), running: false, startedAt: null };
}

export function resetTimer(timer: TimerState): TimerState {
  return { ...timer, remainingMs: timer.durationMs, running: false, startedAt: null };
}

export function setTimerDuration(_timer: TimerState, durationMs: number): TimerState {
  return createTimer(durationMs);
}

/** Remaining time for a running timer; never negative. */
export function tickRemaining(timer: TimerState, now: number = Date.now()): number {
  if (!timer.running || timer.startedAt == null) return Math.max(0, timer.remainingMs);
  return Math.max(0, timer.remainingMs - (now - timer.startedAt));
}

export function toggleTimer(timer: TimerState, now: number = Date.now()): TimerState {
  return timer.running ? pauseTimer(timer, now) : startTimer(timer, now);
}

/** mm:ss (or h:mm:ss for long timers). */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatClock(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function timerProgress(timer: TimerState, now: number = Date.now()): number {
  if (timer.durationMs <= 0) return 0;
  const remaining = tickRemaining(timer, now);
  return Math.min(1, Math.max(0, 1 - remaining / timer.durationMs));
}
