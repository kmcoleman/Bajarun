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
        // Legacy Baja colors
        'baja-dark': '#1e3a5f',
        'baja-sand': '#d4a574',
        'baja-orange': '#e87722',
        // NorCal Moto Adventure colors
        'primary': '#0ea5e9',
        'primary-dark': '#0284c7',
        'background-light': '#f0f9ff',
        'background-dark': '#0c4a6e',
        'overlay-dark': '#0f172a',
      },
    },
  },
  plugins: [],
};
