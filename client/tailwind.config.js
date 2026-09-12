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
        'mut-primary': '#16A34A',      // Green from logo
        'mut-secondary': '#059669',    // Darker green
        'mut-accent': '#10B981',       // Light green accent
        'mut-dark': '#1F2937',         // Dark grey/black for text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
