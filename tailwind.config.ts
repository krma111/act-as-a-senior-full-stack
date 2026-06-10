import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080A0F",
        panel: "#10141D",
        line: "rgba(255,255,255,0.1)",
        brand: "#22FF00",
        brandBright: "#7EFF5E",
        brandDeep: "#0A8526"
      },
      boxShadow: {
        glow: "0 28px 100px rgba(34, 255, 0, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
