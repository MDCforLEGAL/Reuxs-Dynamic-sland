import { useEffect, useState } from "react";
import { extractPalette, type AlbumPalette } from "@core";

/** Cover art is a data URL, so a tiny LRU cache keeps re-sampling cheap. */
const cache = new Map<string, AlbumPalette>();
const CACHE_LIMIT = 16;

/**
 * Extracts the dominant + accent colour of the album cover. Returns null until
 * the first cover has been sampled.
 */
export function useAlbumPalette(
  art: string | null | undefined,
  enabled: boolean
): AlbumPalette | null {
  const [palette, setPalette] = useState<AlbumPalette | null>(null);

  useEffect(() => {
    if (!enabled || !art) {
      setPalette(null);
      return;
    }

    const cached = cache.get(art);
    if (cached) {
      setPalette(cached);
      return;
    }

    let cancelled = false;
    void extractPalette(art).then((next) => {
      if (cancelled || !next) return;
      cache.set(art, next);
      if (cache.size > CACHE_LIMIT) {
        const oldest = cache.keys().next();
        if (!oldest.done) cache.delete(oldest.value);
      }
      setPalette(next);
    });

    return () => {
      cancelled = true;
    };
  }, [art, enabled]);

  return palette;
}
