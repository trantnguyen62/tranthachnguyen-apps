/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand red used for CTAs, active nav indicators, and accent highlights
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Dark palette for the app's near-black background layers (lightest → darkest)
        dark: {
          100: '#1e1e2e', // card / glass surfaces
          200: '#181825', // secondary backgrounds
          300: '#11111b', // page background
          400: '#0a0a0f', // deepest shadow areas
        }
      }
    },
  },
  plugins: [],
}
