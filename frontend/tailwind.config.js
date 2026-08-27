/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#090D16',
          900: '#0F172A',
          850: '#141E33',
          800: '#1E293B',
          750: '#27354A',
          700: '#334155',
          600: '#475569',
        },
        teal: {
          500: '#0D9488',
          400: '#14B8A6',
          300: '#2DD4BF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
