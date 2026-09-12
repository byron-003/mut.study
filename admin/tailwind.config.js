/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#16A34A',
          secondary: '#059669',
          dark: '#065F46',
          light: '#D1FAE5',
        }
      }
    },
  },
  plugins: [],
}
