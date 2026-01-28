/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'sage': '#266150',
        'sage-dark': '#1f4a3d',
        'sage-light': '#3a7e66',
        
        // Secondary Accents
        'beige': '#E8CCBF',
        'beige-light': '#f5dfd4',
        'sand': '#DDAF94',
        'sand-light': '#e8c4b0',
        
        // Neutrals
        'charcoal': '#4F4846',
        'charcoal-light': '#6b6562',
        'off-white': '#FDF8F5',
        
        // Text colors
        'text-primary': '#4F4846',
        'text-secondary': 'rgba(79, 72, 70, 0.8)',
        'text-muted': 'rgba(79, 72, 70, 0.6)',
      },
      backgroundColor: {
        'base': '#FDF8F5',
        'card': 'rgba(232, 204, 191, 0.15)',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '16': '16px',
        '24': '24px',
      },
      borderRadius: {
        'md': '6px',
        'lg': '12px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        'sans': ['system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
      },
    },
  },
  plugins: [],
}
