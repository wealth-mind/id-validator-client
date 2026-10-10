/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand — deep indigo / violet
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Status colours
        valid:   { DEFAULT: '#16a34a', light: '#dcfce7', dark: '#14532d' },
        expired: { DEFAULT: '#d97706', light: '#fef3c7', dark: '#78350f' },
        revoked: { DEFAULT: '#dc2626', light: '#fee2e2', dark: '#7f1d1d' },
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '.5' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':  'fadeIn 0.25s ease both',
        'spin-slow': 'spin 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
