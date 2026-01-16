/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Add this line!
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          600: '#6b7280',
          700: '#9baabf',
        }
      }
    },
  },
  plugins: [],
}
