/**
 * Album cover palette extraction (browser / WebView2).
 *
 * Runs entirely locally: the cover never leaves the machine. Colours are
 * quantised into 4 bits per channel, then the most common "meaningful" bucket
 * becomes the dominant colour and the most saturated one the accent.
 */
import type { AlbumPalette } from "./settings";

const SAMPLE_SIZE = 34;

export const DEFAULT_PALETTE: AlbumPalette = {
  dominant: "#7F1D1D",
  accent: "#EF4444"
};

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
  saturation: number;
}

export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("album cover could not be decoded"));
    image.src = dataUrl;
  });
}

export async function extractPalette(dataUrl: string): Promise<AlbumPalette | null> {
  if (typeof document === "undefined" || !dataUrl) return null;

  let image: HTMLImageElement;
  try {
    image = await loadImage(dataUrl);
  } catch {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const buckets = new Map<number, Bucket>();

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 128) continue;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const value = max;
      // Skip near-black and near-white pixels: they carry no identity.
      if (value < 0.12 || value > 0.97) continue;
      const saturation = max === 0 ? 0 : (max - min) / max;

      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.saturation = Math.max(bucket.saturation, saturation);
      } else {
        buckets.set(key, { r, g, b, count: 1, saturation });
      }
    }

    if (buckets.size === 0) return DEFAULT_PALETTE;

    const all = [...buckets.values()];
    const dominant = all.reduce((best, current) =>
      current.count * (0.35 + current.saturation) > best.count * (0.35 + best.saturation)
        ? current
        : best
    );
    const accent = all.reduce((best, current) =>
      current.saturation * Math.log2(1 + current.count) >
      best.saturation * Math.log2(1 + best.count)
        ? current
        : best
    );

    return { dominant: toHex(dominant), accent: toHex(accent) };
  } catch {
    return null;
  }
}

function toHex({ r, g, b }: Bucket): string {
  const hex = (value: number) => Math.min(255, Math.max(0, value)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}
