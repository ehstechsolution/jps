/** @type {import('tailwindcss').Config} */
export default {
  // "class" habilita o modo escuro controlado por classe (.dark no <html>)
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "Steel" — tons industriais azul/grafite
        steel: {
          50: '#f0f7fb',
          100: '#dcecf6',
          200: '#c0ddf0',
          300: '#94c5e5',
          400: '#61a6d6',
          500: '#3d8ac5',
          600: '#2c6fa8',
          700: '#255a89',
          800: '#224c71',
          900: '#1e3d59',
          950: '#0f2436',
        },
        // Grafite para áreas escuras (sidebar, headline)
        graphite: {
          700: '#3b4451',
          800: '#232a35',
          850: '#1b212b',
          900: '#13171f',
          950: '#0b0e13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.06), 0 4px 16px -4px rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}