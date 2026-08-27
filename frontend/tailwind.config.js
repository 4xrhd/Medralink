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
      fontSize: {
        '2xs': ['var(--text-2xs, 0.65rem)', { lineHeight: '1.4' }],
        'xs': ['var(--text-xs, 0.75rem)', { lineHeight: '1.45' }],
        'sm': ['var(--text-sm, 0.875rem)', { lineHeight: '1.5' }],
        'base': ['var(--text-base, 1rem)', { lineHeight: '1.55' }],
        'lg': ['var(--text-lg, 1.125rem)', { lineHeight: '1.5' }],
        'xl': ['var(--text-xl, 1.25rem)', { lineHeight: '1.4' }],
        '2xl': ['var(--text-2xl, 1.5rem)', { lineHeight: '1.3' }],
        '3xl': ['var(--text-3xl, 1.875rem)', { lineHeight: '1.25' }],
      },
    },
  },
  plugins: [],
};
