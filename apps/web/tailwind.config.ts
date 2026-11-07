import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f5f3',
          100: '#e9e7e2',
          200: '#d2cec5',
          300: '#aea79a',
          400: '#857d6f',
          500: '#655e53',
          600: '#4d473e',
          700: '#3a3530',
          800: '#23211d',
          900: '#141311',
          950: '#0a0a09',
        },
        ivory: {
          50: '#fdfbf7',
          100: '#faf7f0',
          200: '#f4eee1',
          300: '#ebe2cf',
          400: '#dccfae',
          500: '#c9b78d',
        },
        gold: {
          100: '#f8efdc',
          200: '#efdcb4',
          300: '#e4c78d',
          400: '#d4ae65',
          500: '#c29a4d',
          600: '#a87d3a',
          700: '#856030',
          800: '#5d4423',
          900: '#3b2c17',
        },
        brand: {
          50: '#eff7f2',
          100: '#d8ece1',
          200: '#b0d8c4',
          300: '#80bda1',
          400: '#4f9c7d',
          500: '#2f8062',
          600: '#20674e',
          700: '#1a5340',
          800: '#154334',
          900: '#11372b',
          950: '#0a211b',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-manrope)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'var(--font-cormorant)',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        sharpest: '-0.045em',
        wider: '0.08em',
        widest: '0.22em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 19, 17, 0.04), 0 12px 32px -18px rgba(20, 19, 17, 0.18)',
        lift: '0 2px 4px rgba(20, 19, 17, 0.06), 0 28px 60px -28px rgba(20, 19, 17, 0.32)',
        gold: '0 18px 48px -20px rgba(194, 154, 77, 0.55)',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        silk: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translate3d(-50%, 0, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translate3d(0, 110%, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 18px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        drawLine: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        marquee: 'marquee 42s linear infinite',
        'marquee-reverse': 'marqueeReverse 52s linear infinite',
        float: 'float 8s ease-in-out infinite',
        'spin-slow': 'spinSlow 34s linear infinite',
        rise: 'rise 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.4s linear infinite',
        'draw-line': 'drawLine 1.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
