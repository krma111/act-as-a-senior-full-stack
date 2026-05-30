import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080A0F",
        panel: "#10141D",
        line: "rgba(255,255,255,0.1)",
        brand: "#55E0C4",
        flame: "#FF7A59"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(85, 224, 196, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
