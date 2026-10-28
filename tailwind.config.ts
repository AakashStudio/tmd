import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Oracle Sans"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        // TMD Aura Gold Design System Tokens
        aura: {
          gold: "#FFC629",
          amber: "#F59E0B",
          metallic: "#D4AF37",
          dark: "#08080b",
          surface: "#121217",
          elevated: "#1a1a24",
          border: "#22222d",
          muted: "#888896",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
export default config;
