/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#101B4D',
          blue: '#315CF6',
          teal: '#20BFA3',
          lavender: '#E8E7FF',
        }
      }
    },
  },
  plugins: [],
}
