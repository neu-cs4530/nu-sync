/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'status-icon',
    'status-icon-online',
    'status-icon-away',
    'status-icon-busy',
    'status-icon-invisible',
  ],
};
