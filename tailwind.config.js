/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F1FE',
          100: '#EAE4FD',
          200: '#D6CBFB',
          300: '#B7A3F6',
          400: '#9273EF',
          500: '#7C4DE8',
          600: '#6C35DC',
          700: '#5B27BC',
          800: '#4A2199',
          900: '#2E1A5E',
          ink: '#2B1B57',
        },
        canvas: '#F6F5FA',
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43,27,87,0.04), 0 6px 16px rgba(43,27,87,0.06)',
        fab: '0 8px 20px rgba(108,53,220,0.35)',
        sheet: '0 -8px 30px rgba(43,27,87,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 220ms cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 200ms ease-out',
        'pop-in': 'pop-in 260ms cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
