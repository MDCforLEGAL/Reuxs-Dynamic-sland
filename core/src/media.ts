/**
 * Live "now playing" snapshot shared by Windows (SMTC via the Rust shell) and
 * Android (MediaSessionManager). The capsule only displays it and forwards
 * play / pause; it never owns the playback session.
 */
import type { AlbumPalette } from "./settings";

export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  playing: boolean;
  /** Playback position in milliseconds. */
  positionMs: number;
  /** Track length in milliseconds, 0 when the player does not report it. */
  durationMs: number;
  /** Cover art as a data URL (`data:image/png;base64,…`) or null. */
  art: string | null;
}

export const EMPTY_NOW_PLAYING: NowPlaying = {
  title: "",
  artist: "",
  album: "",
  playing: false,
  positionMs: 0,
  durationMs: 0,
  art: null
};

export function hasTrack(track: NowPlaying | null | undefined): boolean {
  return Boolean(track && track.title.trim().length > 0);
}

export function isSameTrack(a: NowPlaying | null, b: NowPlaying | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.title === b.title &&
    a.artist === b.artist &&
    a.album === b.album &&
    Boolean(a.art) === Boolean(b.art)
  );
}

export function playbackProgress(track: NowPlaying): number {
  if (track.durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, track.positionMs / track.durationMs));
}

export function formatPlayback(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Empty palette used until the real cover has been sampled. */
export const FALLBACK_PALETTE: AlbumPalette = { dominant: "#7F1D1D", accent: "#EF4444" };
