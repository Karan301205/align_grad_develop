/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        mono: ["Geist", "sans-serif"],
      }
    },
  },
  plugins: [],
}
