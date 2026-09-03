export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        navy: { DEFAULT: '#00366e', dark: '#001f45', mid: '#00428d' },
        gold: { DEFAULT: '#c9a84c', light: '#e8d08a' },
        
        surface: '#f5f7fa',
        card: '#ffffff',
        border: '#e2e8f0',
        muted: '#6b7a99',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,31,69,.06), 0 4px 16px rgba(0,31,69,.04)',
        modal: '0 8px 40px rgba(0,31,69,.18)',
        dropdown: '0 6px 24px rgba(0,31,69,.12)',
      },
      transitionDuration: { DEFAULT: '150ms' },
    },
  },
  plugins: [],
};