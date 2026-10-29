/** @type {import('tailwindcss').Config} */
export default {
  // Archivos donde Tailwind busca clases
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Colores del equipo (sacados del Figma)
      colors: {
        fondo: '#101418',
        tarjeta: '#1D2025',
        menta: '#78D59E',
        lima: '#C3F400',
        peligro: '#BA3200',
        cian: '#00E3FD',
        suave: '#C4C9AC',
      },
      // Fuentes del equipo
      fontFamily: {
        titulos: ['"Plus Jakarta Sans"', 'sans-serif'],
        datos: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
