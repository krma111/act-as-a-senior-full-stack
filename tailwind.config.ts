import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080A0F",
        panel: "#10141D",
        line: "rgba(255,255,255,0.1)",
        brand: "#39FF14",
        brandBright: "#7DFF6B",
        brandDeep: "#0F7A25"
      },
      boxShadow: {
        glow: "0 24px 90px rgba(57, 255, 20, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
