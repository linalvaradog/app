/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palmas: {
          dark: '#0D1B0F',
          card: '#1A2E1C',
          green: '#2E7D32',
          light: '#81C784',
          accent: '#1B5E20',
        }
      }
    },
  },
  plugins: [],
}