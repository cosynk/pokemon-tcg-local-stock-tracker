/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { red: '#CC0000', darkred: '#8F0000', blue: '#2A75BB', yellow: '#FFCB05', navy: '#1B2A4A', ink: '#111827' },
      },
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
