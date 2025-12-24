/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'baja-dark': '#1e3a5f',
        'baja-sand': '#d4a574',
        'baja-orange': '#e87722',
      },
    },
  },
  plugins: [],
};
