import { useCallback, useEffect, useState } from "react";
import {
  createTimer,
  resetTimer,
  tickRemaining,
  timerProgress,
  toggleTimer,
  type TimerState
} from "@core";

export interface TimerApi {
  timer: TimerState;
  remainingMs: number;
  running: boolean;
  progress: number;
  toggle: () => void;
  reset: () => void;
  setDuration: (durationMs: number) => void;
}

export function useTimer(durationMs = 60_000): TimerApi {
  const [timer, setTimer] = useState<TimerState>(() => createTimer(durationMs));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer.running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const remainingMs = tickRemaining(timer, now);

  useEffect(() => {
    if (timer.running && remainingMs <= 0) {
      setTimer((previous) => ({ ...previous, remainingMs: 0, running: false, startedAt: null }));
    }
  }, [timer.running, remainingMs]);

  const toggle = useCallback(() => setTimer((previous) => toggleTimer(previous, Date.now())), []);
  const reset = useCallback(() => setTimer((previous) => resetTimer(previous)), []);
  const setDuration = useCallback((next: number) => setTimer(() => createTimer(next)), []);

  return {
    timer,
    remainingMs,
    running: timer.running,
    progress: timerProgress(timer, now),
    toggle,
    reset,
    setDuration
  };
}
