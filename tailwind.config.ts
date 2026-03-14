import type { Config } from "tailwindcss";
 
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0e0b08",
        ink: "#0e0b08",
        clay: "#c8692e",
        ember: "#e8843a",
        gold: "#d4a853",
        cream: "#faf6ef",
        muted: "#7a6a58",
        dim: "#1a1208",
        subtle: "rgba(250,246,239,0.06)",
        border: "rgba(200,105,46,0.12)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Outfit", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "3px",
      },
    },
  },
  plugins: [],
};
 
export default config;