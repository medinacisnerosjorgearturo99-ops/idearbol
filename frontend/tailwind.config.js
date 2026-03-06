/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F17', // El azul/gris súper oscuro del fondo
        surface: '#141923',    // El color de la barra lateral
        primary: '#6366f1',    // Indigo para botones y acentos
      }
    },
  },
  plugins: [],
}