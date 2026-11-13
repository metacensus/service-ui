import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const preset = require("@metacensus/library-ui/tailwind3");
const { mc } = preset.theme.extend.colors;

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  presets: [preset],
  prefix: "",
  safelist: [
    "bg-sky-200",
    "bg-blue-200",
    "bg-red-200",
    "bg-orange-200",
    "bg-indigo-200",
    "bg-emerald-200",
    "bg-gray-200",
    "text-sky-700",
    "text-orange-700",
    "text-indigo-700",
    "text-emerald-700",
    "text-gray-700",
    "text-blue-700",
    "text-red-700",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: mc.hairline,
        input: mc["line-input"],
        ring: mc["line-accent"],
        // Palette steps, not roles: no `/NN` modifier.
        mc: { "blue-bold": "var(--mc-blue-bold)", "blue-mid": "var(--mc-blue-mid)" },
        background: mc.ground,
        foreground: mc.ink,
        primary: {
          DEFAULT: mc.action,
          foreground: mc["ink-on-fill"],
        },
        secondary: {
          DEFAULT: mc.surface,
          foreground: mc.ink,
        },
        destructive: {
          DEFAULT: mc["alert-border"],
          foreground: mc["ink-on-fill"],
        },
        muted: {
          DEFAULT: mc.surface,
          foreground: mc.ink,
        },
        accent: {
          DEFAULT: mc.surface,
          foreground: mc.ink,
        },
        popover: {
          DEFAULT: mc.card,
          foreground: mc.ink,
        },
        card: {
          DEFAULT: mc.card,
          foreground: mc.ink,
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--mc-font-sans)", ...fontFamily.sans],
        display: ["var(--font-display)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;

export default config;
