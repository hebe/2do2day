/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Add this line!
  theme: {
    extend: {
      colors: {
        /* Legacy palette — kept so old calm-* classes still work during migration */
        calm: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          600: '#6b7280',
          700: '#9baabf',
        },
        /* Semantic tokens — wired to CSS variables in index.css */
        card:  'var(--bg-card)',
        hover: 'var(--bg-hover)',
        input: 'var(--bg-input)',
        page:  'var(--bg-page)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted:   'var(--text-muted)',
          faint:   'var(--text-faint)',
        },
        edge: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        /* action = primary buttons / CTAs */
        action: {
          DEFAULT: 'var(--action)',
          hover:   'var(--action-hover)',
          on:      'var(--on-action)',
          subtle:  'var(--action-subtle)',
        },
        /* accent = highlights, display type colour, heading tint */
        accent: {
          DEFAULT: 'var(--accent)',
          subtle:  'var(--accent-subtle)',
        },
        /* brand = legacy alias → same as action; keep while components migrate */
        brand: {
          DEFAULT: 'var(--action)',
          dark:    'var(--action-hover)',
          on:      'var(--on-action)',
          subtle:  'var(--action-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark:    'var(--secondary-dark)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Source Serif 4', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
