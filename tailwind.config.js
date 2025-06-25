/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'SF Pro', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          dark: '#0E0E0E',
        },
        accent: {
          gold: '#D5C3A5',
        },
        'neon-green': '#4ADE80', // Changed to a more matte, dull green
        'artist-purple': '#A78BFA', // New purple color for artist usernames
        'charcoal-matte': '#0E0E0E',
        'dark-gray-bg': '#1A1A1A',
        'dark-gray-border': '#1B1B1B',
        'light-text': '#E6E6E6',
      },
      boxShadow: {
        'inner-custom': '0 0 0 1px #1B1B1B inset',
        'double-border': '0 0 0 2px #000000, 0 0 0 4px #ffffff, 0 0 0 6px #000000', // Double border effect
      },
      width: {
        'decode-panel': '380px',
      },
    },
  },
  plugins: [],
};