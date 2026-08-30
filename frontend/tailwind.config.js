export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0a0f',
        surface:  '#12121a',
        surface2: '#1a1a2e',
        border:   '#2a2a3e',
        primary:  '#7c3aed',
        accent:   '#06b6d4',
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};
