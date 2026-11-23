/**
 * Persisted ReuXs preferences.
 *
 * The capsule window and the independent control panel (settings app) share
 * these values. Windows keeps them in `localStorage`, Android in
 * SharedPreferences (see SettingsStore.kt); both sides mirror the same shape,
 * so the two implementations stay comparable.
 */

export const THEME_MODES = ["crimson", "oled", "custom", "album"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const VISUALIZER_STYLES = ["bars", "wave"] as const;
export type VisualizerStyle = (typeof VISUALIZER_STYLES)[number];

export interface ReuxsSettings {
  /** Schema version, bumped when a migration is needed. */
  version: number;

  /* ---------------------------------------------------------- geometry */
  /** Horizontal offset in px, 0 = horizontally centred. */
  offsetX: number;
  /** Vertical offset in px from the top edge. */
  offsetY: number;
  /** Uniform UI scale (0.75 – 1.35). */
  scale: number;

  /* -------------------------------------------------------- appearance */
  /** Background opacity (0.35 – 1). */
  opacity: number;
  /** Backdrop blur in px (0 – 28). */
  blur: number;
  themeMode: ThemeMode;
  /** Accent used by the `custom` theme mode. */
  customAccent: string;
  /** Border glow strength 0 – 100. */
  glow: number;
  /** Corner radius in px (8 – 34). */
  radius: number;

  /* ------------------------------------------------------------- music */
  musicEnabled: boolean;
  /** Tint the capsule with the album cover colours. */
  adaptivePalette: boolean;
  visualizer: boolean;
  visualizerStyle: VisualizerStyle;

  /* ----------------------------------------------------------- general */
  /** Start the capsule with the operating system (opt-in). */
  autostart: boolean;
  /** Temporarily hide the capsule without closing the app. */
  capsuleHidden: boolean;
}

export const DEFAULT_SETTINGS: ReuxsSettings = {
  version: 1,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  opacity: 0.86,
  blur: 18,
  themeMode: "crimson",
  customAccent: "#EF4444",
  glow: 55,
  radius: 26,
  musicEnabled: true,
  adaptivePalette: true,
  visualizer: true,
  visualizerStyle: "bars",
  autostart: false,
  capsuleHidden: false
};

export const SETTINGS_STORAGE_KEY = "reuxs.settings.v1";

/** Default capsule geometry, mirrored by the Tauri shell and the Android overlay. */
export const CAPSULE_FRAME = {
  baseWidth: 520,
  baseHeight: 420,
  topInset: 16
} as const;

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

export function sanitizeHex(value: unknown, fallback = DEFAULT_SETTINGS.customAccent): string {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#?([0-9a-f]{6})$/i);
  return match ? `#${match[1].toUpperCase()}` : fallback;
}

/** Coerces anything (old storage, hand edited JSON) into valid settings. */
export function normalizeSettings(raw: Partial<ReuxsSettings> | null | undefined): ReuxsSettings {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    offsetX: Math.round(clamp(source.offsetX, -800, 800, DEFAULT_SETTINGS.offsetX)),
    offsetY: Math.round(clamp(source.offsetY, -400, 900, DEFAULT_SETTINGS.offsetY)),
    scale: Number(clamp(source.scale, 0.75, 1.35, DEFAULT_SETTINGS.scale).toFixed(2)),
    opacity: Number(clamp(source.opacity, 0.35, 1, DEFAULT_SETTINGS.opacity).toFixed(2)),
    blur: Math.round(clamp(source.blur, 0, 28, DEFAULT_SETTINGS.blur)),
    themeMode: THEME_MODES.includes(source.themeMode as ThemeMode)
      ? (source.themeMode as ThemeMode)
      : DEFAULT_SETTINGS.themeMode,
    customAccent: sanitizeHex(source.customAccent),
    glow: Math.round(clamp(source.glow, 0, 100, DEFAULT_SETTINGS.glow)),
    radius: Math.round(clamp(source.radius, 8, 34, DEFAULT_SETTINGS.radius)),
    musicEnabled: source.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled,
    adaptivePalette: source.adaptivePalette ?? DEFAULT_SETTINGS.adaptivePalette,
    visualizer: source.visualizer ?? DEFAULT_SETTINGS.visualizer,
    visualizerStyle: VISUALIZER_STYLES.includes(source.visualizerStyle as VisualizerStyle)
      ? (source.visualizerStyle as VisualizerStyle)
      : DEFAULT_SETTINGS.visualizerStyle,
    autostart: source.autostart ?? DEFAULT_SETTINGS.autostart,
    capsuleHidden: source.capsuleHidden ?? DEFAULT_SETTINGS.capsuleHidden
  };
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadSettings(): ReuxsSettings {
  const store = storage();
  if (!store) return DEFAULT_SETTINGS;
  try {
    const raw = store.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw) as Partial<ReuxsSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ReuxsSettings): ReuxsSettings {
  const normalized = normalizeSettings(settings);
  try {
    storage()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* private mode / quota: the UI keeps working with in-memory state */
  }
  return normalized;
}

export function resetSettings(): ReuxsSettings {
  return saveSettings(DEFAULT_SETTINGS);
}

/* ----------------------------------------------------------- colour math */

function hexToRgb(hex: string): [number, number, number] {
  const clean = sanitizeHex(hex).slice(1);
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha)).toFixed(3)})`;
}

/** Linear mix: `weight` is how much of `to` ends up in the result (0 – 1). */
export function mixHex(from: string, to: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const w = Math.min(1, Math.max(0, weight));
  const channel = (a: number, b: number) => Math.round(a + (b - a) * w);
  const hex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${hex(channel(r1, r2))}${hex(channel(g1, g2))}${hex(channel(b1, b2))}`.toUpperCase();
}

/** Relative luminance (0 = black, 1 = white), used to pick readable text. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface AlbumPalette {
  /** Most common meaningful colour of the cover. */
  dominant: string;
  /** Most saturated colour of the cover. */
  accent: string;
}

export interface CapsuleAppearance {
  gradient: string;
  expandedGradient: string;
  border: string;
  accent: string;
  accentSoft: string;
  glow: string;
}

/**
 * Resolves the palette for the current theme mode. `album` falls back to the
 * default crimson when no cover is available yet.
 */
export function capsuleAppearance(
  settings: ReuxsSettings,
  palette: AlbumPalette | null = null
): CapsuleAppearance {
  const album = settings.themeMode === "album" ? palette : null;
  const accent =
    album?.accent ?? (settings.themeMode === "custom" ? sanitizeHex(settings.customAccent) : "#EF4444");
  const base = album?.dominant ?? accent;

  if (settings.themeMode === "oled") {
    return {
      gradient:
        "radial-gradient(130% 170% at 50% -40%, #141414 0%, #0A0A0A 38%, #050505 68%, #000000 100%)",
      expandedGradient:
        "radial-gradient(120% 140% at 20% -20%, rgba(32, 32, 32, 0.92) 0%, rgba(14, 14, 14, 0.94) 44%, #050505 78%, #000000 100%)",
      border: "rgba(255, 255, 255, 0.14)",
      accent: "#E4E4E7",
      accentSoft: "#A1A1AA",
      glow: "rgba(255, 255, 255, 0.18)"
    };
  }

  const deep = mixHex(base, "#000000", 0.72);
  const mid = mixHex(base, "#000000", 0.55);
  const rim = mixHex(base, "#000000", 0.4);

  return {
    gradient: `radial-gradient(130% 170% at 50% -40%, ${rim} 0%, ${mid} 38%, ${deep} 68%, #000000 100%)`,
    expandedGradient: `radial-gradient(120% 140% at 20% -20%, ${withAlpha(mid, 0.9)} 0%, ${withAlpha(
      deep,
      0.94
    )} 42%, #09090B 78%, #000000 100%)`,
    border: withAlpha(accent, 0.35),
    accent,
    accentSoft: mixHex(accent, "#FFFFFF", 0.3),
    glow: withAlpha(accent, 0.35)
  };
}

/** Window size that keeps a scaled capsule fully on screen. */
export function capsuleWindowSize(settings: ReuxsSettings): { width: number; height: number } {
  return {
    width: Math.round(CAPSULE_FRAME.baseWidth * settings.scale),
    height: Math.round(CAPSULE_FRAME.baseHeight * settings.scale)
  };
}
