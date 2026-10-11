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
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f4f9",
          100: "#dbe5f2",
          500: "#1a365d",
          800: "#0f172a",
          900: "#0a0f1d",
        },
        saffron: {
          50: "#fff9eb",
          100: "#ffefc6",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        }
      },
      borderRadius: {
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
    },
  },
  plugins: [],
};
export default config;
