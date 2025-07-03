/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // --- ADDED: Kredivo brand color palette ---
      colors: {
        kredivo: {
          primary: '#FF5722', // The main orange-red
          'primary-hover': '#F0501E', // A slightly darker shade for hover states
          'light': '#FFF3E0', // A light orange for backgrounds
          'dark-text': '#E64A19', // A darker text color
        },
        // You can also define other colors like danger for consistency
        danger: {
          DEFAULT: '#EF4444', // red-500
          hover: '#DC2626' // red-600
        }
      }
    },
  },
  plugins: [],
}