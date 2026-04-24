import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "#0b1220",
        panel: "#111a2b",
        line: "#1f2a44",
        accent: "#00e5a8",
        danger: "#ff4d6d",
        warning: "#ffb547",
        ink: "#e6eefc",
        muted: "#8ea0c4"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,229,168,.12), 0 20px 40px rgba(0,0,0,.35)",
        sos: "0 24px 70px rgba(255,77,109,.35)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
