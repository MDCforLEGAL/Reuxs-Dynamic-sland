/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#000000",
          900: "#09090B",
          800: "#180505"
        },
        crimson: {
          950: "#450A0A",
          900: "#7F1D1D",
          500: "#EF4444",
          400: "#F87171"
        },
        ink: {
          50: "#FAFAFA",
          400: "#A1A1AA",
          500: "#71717A"
        }
      },
      fontFamily: {
        display: ["'Segoe UI Variable Display'", "'Segoe UI'", "Inter", "system-ui", "sans-serif"],
        body: ["'Segoe UI Variable Text'", "'Segoe UI'", "Inter", "system-ui", "sans-serif"],
        mono: ["'Cascadia Code'", "'JetBrains Mono'", "ui-monospace", "monospace"]
      },
      boxShadow: {
        capsule: "0 0 0 1px rgba(220,38,38,0.35), 0 10px 30px -14px rgba(239,68,68,0.45)",
        ambient: "0 0 0 1px rgba(220,38,38,0.35), 0 18px 48px -18px rgba(239,68,68,0.55)",
        active:
          "0 0 0 1px rgba(248,113,113,0.45), 0 0 34px 2px rgba(239,68,68,0.32), 0 24px 60px -20px rgba(239,68,68,0.6)"
      }
    }
  },
  plugins: []
};
