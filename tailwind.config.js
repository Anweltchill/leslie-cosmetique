/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F1E8',
        nude: '#EADBC8',
        sand: '#D9C4AC',
        caramel: '#96633F',
        'caramel-bright': '#B58B6A',
        brown: '#6B4A38',
        espresso: '#3A2A22',
        'white-warm': '#FFFBF6',
      },
      transitionTimingFunction: {
        'lc-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
