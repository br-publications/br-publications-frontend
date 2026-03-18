/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // You can add custom breakpoints here for "all resolutions"
      screens: {
        'xs': '480px',
      },
      fontFamily: {
        // This sets the default font-family for the entire app
        sans: ['"Noto Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Roboto"', '"Oxygen-Sans"', '"Ubuntu"', '"Cantarell"', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}