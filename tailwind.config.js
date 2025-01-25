/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    screens: {
      xs: "360px", // Petits téléphones
      sm: "412px", // Samsung S20 Ultra, S21 Ultra, S22 Ultra, S23 Ultra
      md: "768px", // Tablettes
      lg: "1024px", // Petits laptops
      xl: "1280px", // Laptops standards
      "2xl": "1536px", // Grands écrans
    },
  },
  plugins: [],
};
