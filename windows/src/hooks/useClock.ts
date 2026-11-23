import { useEffect, useState } from "react";

/** Minute-accurate clock; wakes the UI 4x per minute instead of 60x. */
export function useClock(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
