/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retro: ['"VT323"', 'monospace'],
      },
      colors: {
        rank: {
          navy: '#0f1f38',
          navyLight: '#16243d',
          navyDark: '#0b1526',
          gold: '#f5b942',
          silver: '#c7ccd6',
          bronze: '#cd7f32',
        },
      },
    },
  },
  plugins: [],
}
