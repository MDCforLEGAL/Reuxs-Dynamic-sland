/** "Crimson & Obsidian" design tokens. Mirrored in Android CapsuleTheme.kt. */
export const theme = {
  colors: {
    backgroundStart: "#000000",
    backgroundMid: "#09090B",
    backgroundEnd: "#450A0A",
    backgroundDeep: "#7F1D1D",
    surface: "rgba(9, 9, 11, 0.86)",
    surfaceRaised: "rgba(24, 12, 12, 0.92)",
    border: "rgba(220, 38, 38, 0.35)",
    borderStrong: "rgba(248, 113, 113, 0.55)",
    accent: "#EF4444",
    accentSoft: "#7F1D1D",
    textPrimary: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    glow: "rgba(239, 68, 68, 0.35)"
  },
  radii: {
    capsule: "999px",
    card: "18px",
    pill: "999px"
  },
  gradients: {
    /** Deep matte black bleeding into dark blood red. */
    capsule:
      "radial-gradient(130% 170% at 50% -40%, #7F1D1D 0%, #450A0A 38%, #180505 68%, #000000 100%)",
    expanded:
      "radial-gradient(120% 140% at 20% -20%, rgba(127, 29, 29, 0.85) 0%, rgba(69, 10, 10, 0.92) 42%, #09090B 78%, #000000 100%)",
    highlight: "linear-gradient(120deg, rgba(248, 113, 113, 0.22), rgba(0, 0, 0, 0) 55%)",
    track: "linear-gradient(90deg, #7F1D1D, #EF4444)"
  },
  shadows: {
    ambient: "0 0 0 1px rgba(220, 38, 38, 0.35), 0 18px 48px -18px rgba(239, 68, 68, 0.55)",
    active:
      "0 0 0 1px rgba(248, 113, 113, 0.45), 0 0 34px 2px rgba(239, 68, 68, 0.32), 0 24px 60px -20px rgba(239, 68, 68, 0.6)",
    compact: "0 0 0 1px rgba(220, 38, 38, 0.35), 0 10px 30px -14px rgba(239, 68, 68, 0.45)"
  },
  motion: {
    spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.9 },
    softSpring: { type: "spring", stiffness: 260, damping: 30 },
    fast: { type: "spring", stiffness: 520, damping: 36 }
  },
  typography: {
    display: "'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, -apple-system, sans-serif",
    body: "'Segoe UI Variable Text', 'Segoe UI', Inter, system-ui, -apple-system, sans-serif",
    mono: "'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace"
  }
} as const;

export type ReuxsTheme = typeof theme;
