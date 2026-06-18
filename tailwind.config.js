/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08080f',
        surface: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.07)',
        purple: '#7f77dd',
        'purple-light': '#afa9ec',
        teal: '#5dcaa5',
        'teal-dark': '#1d9e75',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}