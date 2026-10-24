/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palmas: {
          dark:    '#0B1220',
          card:    '#111827',
          green:   '#1D4ED8',
          light:   '#94A3B8',
          accent:  '#1E40AF',
          blue:    '#3B82F6',
          border:  '#1E293B',
        }
      }
    },
  },
  plugins: [],
}
