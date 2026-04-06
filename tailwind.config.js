/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#fdf5ef',
          100: '#f5e4d0',
          200: '#e8c9a0',
          300: '#d4a870',
          400: '#b8854a',
          500: '#8b5e2e',
          600: '#6b4420',
          700: '#523216',
          800: '#3d230e',
          900: '#2e1a09',
          950: '#1a0d04',
        },
        gold: {
          50:  '#fefbe8',
          100: '#fdf5c0',
          200: '#fae97a',
          300: '#f5d630',
          400: '#e8c018',
          500: '#c9a010',
          600: '#a8800c',
          700: '#86620a',
          800: '#664c08',
          900: '#4a3606',
        },
      },
    },
  },
  plugins: [],
}
