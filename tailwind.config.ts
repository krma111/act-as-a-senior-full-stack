import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080A0F",
        panel: "#10141D",
        line: "rgba(255,255,255,0.1)",
        brand: "#22C55E",
        brandBright: "#4ADE80",
        brandDeep: "#15803D"
      },
      boxShadow: {
        glow: "0 24px 90px rgba(34, 197, 94, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
