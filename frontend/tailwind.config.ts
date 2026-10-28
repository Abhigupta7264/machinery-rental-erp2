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
        brand: {
          50: "#f0f4f9",
          100: "#e1e9f3",
          200: "#c3d3e7",
          300: "#95b4d6",
          400: "#608fc1",
          500: "#3d71ab",
          600: "#2d578f",
          700: "#1e3a63", // Enterprise Navy accent
          800: "#182e4e",
          900: "#122037",
          950: "#0b1424",
        },
      },
    },
  },
  plugins: [],
};
export default config;

