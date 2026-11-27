/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fundo: '#FBFAF8',
        tinta: '#14231F',
        suave: '#5E7772',
        linha: '#E6E8E4',
        verde: { DEFAULT: '#2A6258', escuro: '#214F47', claro: '#EAF1EF' },
        sol: '#E9A23B',
        alerta: { DEFAULT: '#B4452B', claro: '#FBEBE6' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 12px 32px -16px rgba(20,35,31,.18)' },
    },
  },
  plugins: [],
};
