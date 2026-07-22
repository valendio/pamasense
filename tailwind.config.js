/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pama: {
          navy: '#0a2a66',
          blue: '#294483',
          yellow: '#ffc928',
          gold: '#f2b318',
          soft: '#f3f5f7',
          medium: '#a7afbd',
          charcoal: '#2d3138',
          line: '#d9e2f0',
          red: '#d64545',
          orange: '#ef8f2f',
          green: '#25a56a',
          info: '#2d85c7',
          deep: '#153a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
