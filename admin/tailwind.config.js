/** @type {import('tailwindcss').Config} */
export default {
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
