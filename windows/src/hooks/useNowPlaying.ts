import { useCallback, useEffect, useState } from "react";
import type { NowPlaying } from "@core";
import { invokeSafe, isTauri } from "../lib/os";

export type MediaAction = "toggle" | "next" | "previous";

export interface NowPlayingApi {
  track: NowPlaying | null;
  control: (action: MediaAction) => void;
}

/** Polls the Rust SMTC bridge once a second; the OS owns playback state. */
export function useNowPlaying(enabled: boolean): NowPlayingApi {
  const [track, setTrack] = useState<NowPlaying | null>(null);

  useEffect(() => {
    if (!enabled || !isTauri()) {
      setTrack(null);
      return;
    }

    let cancelled = false;
    const poll = async () => {
      const next = await invokeSafe<NowPlaying>("now_playing");
      if (cancelled) return;
      setTrack(next && next.title.trim() ? next : null);
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled]);

  const control = useCallback((action: MediaAction) => {
    void invokeSafe("media_control", { action });
  }, []);

  return { track, control };
}
