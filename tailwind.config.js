/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arc: {
          orange: 'var(--arc-orange)',
          'orange-hover': 'var(--arc-orange-hover)',
          red: 'var(--arc-red)',
          green: 'var(--arc-green)',
          blue: 'var(--arc-blue)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          accent: 'var(--border-accent)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'glow': 'var(--shadow-glow)',
        'glow-sm': '0 0 15px var(--arc-orange-glow)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'lg': '12px',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
