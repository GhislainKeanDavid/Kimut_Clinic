/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        Primary: '#3F5D4A',
        Accent: '#C9663A',
        Background: '#F4F1EA',
        Dark: '#1C1C1A',
        Mist: '#DCD7CB',
      },
      fontFamily: {
        sans: ['Geist', 'Instrument Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
