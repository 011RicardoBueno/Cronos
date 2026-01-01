/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
        },
        // Additional flat color keys to ensure utilities are generated predictably
        'brand-primary': 'var(--color-primary)',
        'brand-secondary': 'var(--color-secondary)',
        'brand-accent': 'var(--color-accent)',
        'brand-surface': 'var(--color-surface)',
        'brand-text': 'var(--color-text)',
        'brand-muted': 'var(--color-muted)',
      }
    },
  },
  plugins: [],
}
