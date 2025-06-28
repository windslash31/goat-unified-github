/** @type {import('tailwindcss').Config} */
module.exports = {
  // FIXED: Ensure darkMode is set to 'class'
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}