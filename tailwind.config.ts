import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        // Oxford Blue — texto e superfícies escuras
        ink: {
          DEFAULT: "#080F26",
          soft: "#2a3149",
          mute: "#6B7184",
        },
        // White Smoke — fundos
        paper: {
          DEFAULT: "#F2F2F2",
          card: "#FFFFFF",
          line: "#E4E4E8",
        },
        // Folly Red — cor da marca
        brand: {
          DEFAULT: "#FB0047",
          dark: "#D6003C",
          soft: "#FFE1EA",
        },
        jet: "#303030",
        gold: "#B45309",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(8,15,38,0.04), 0 10px 28px -14px rgba(8,15,38,0.20)",
        lift: "0 2px 4px rgba(8,15,38,0.06), 0 22px 48px -18px rgba(8,15,38,0.30)",
        brand: "0 10px 30px -10px rgba(251,0,71,0.45)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { rise: "rise 0.6s cubic-bezier(0.22,1,0.36,1) both" },
    },
  },
  plugins: [],
};
export default config;
