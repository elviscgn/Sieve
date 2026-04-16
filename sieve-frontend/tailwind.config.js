/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar': '#2563eb',
        'sidebar-active': 'rgba(255, 255, 255, 0.18)',
        'page': '#f4f7fe',
        'primary': '#2563eb',
        'primary-dark': '#1d4ed8',
        'primary-light': '#3b82f6',
        'primary-pale': '#eff6ff',
      },
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fadeUp': 'fadeUp 0.35s ease both',
        'shimmer': 'shimmer 1.4s infinite',
        'scan': 'scan 1.4s ease-in-out infinite',
        'cardReveal': 'cardReveal 0.4s ease forwards',
        'logFadeIn': 'logFadeIn 0.3s ease forwards',
        'slideUpPill': 'slideUpPill 0.2s ease-out forwards',
        'progress': 'progress 2.5s linear',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        scan: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        cardReveal: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        logFadeIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUpPill: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          from: { width: '0%' },
          to: { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};