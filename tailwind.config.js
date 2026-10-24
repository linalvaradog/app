/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palmas: {
          dark:   'rgb(var(--palmas-dark) / <alpha-value>)',
          card:   'rgb(var(--palmas-card) / <alpha-value>)',
          green:  'rgb(var(--palmas-green) / <alpha-value>)',
          light:  'rgb(var(--palmas-light) / <alpha-value>)',
          accent: 'rgb(var(--palmas-accent) / <alpha-value>)',
          blue:   'rgb(var(--palmas-blue) / <alpha-value>)',
          border: 'rgb(var(--palmas-border) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
