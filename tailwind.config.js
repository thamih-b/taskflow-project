/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // la clase "dark" en el elemento raíz activa el modo oscuro [web:1]
  content: ['./index.html', './script.js'],
  theme: {
    extend: {
      colors: {
        // Paleta libro antiguo / steampunk suave [web:9][web:27]
        parchment: {
          DEFAULT: '#f5ecd6',
          dark: '#1c1917',
        },
        brass: '#b88b4a',
        copper: '#a15c38',
        ink: '#1f2933',
        inksoft: '#374151',
      },
      fontFamily: {
        // Courier New como mono; se puede refinar en config real [web:8]
        mono: ['"Courier New"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
