/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/hooks/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#2DFC44',
          dark: '#1DC433',
        },
        ink: '#0D0D0D',
        paper:'#FAFAF8',
        alt: '#F2F0EB',
      },
      fontFamily: {
        sans:  ['Outfit', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono:  ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['9px', { letterSpacing: '0.12em' }],
      },
    },
  },
  plugins: [],
}