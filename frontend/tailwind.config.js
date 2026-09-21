/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Neon palette (from design reference)
        midnight: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
          950: '#0f172a',
        },
        neon: {
          // Primary purple accent
          purple: {
            400: '#a78bfa',
            500: '#7c3aed',
            600: '#6d28d9',
            700: '#5b21b6',
          },
          // Cyan secondary accent
          cyan: {
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
          },
          // Lavender tertiary
          lavender: {
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6',
          },
        },
        // Light background
        canvas: {
          DEFAULT: '#ede9fe',
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
        },
        // Payment brand colors (keep as-is)
        momo: {
          mtn:    '#ffcc00',
          telecel: '#e60000',
          at:     '#003399',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        'card-sm':  '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-md':  '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
        'card-lg':  '0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
        'bump-glow': '0 0 15px rgba(124, 58, 237, 0.25)',
        'nexa-fab':  '0 4px 12px rgba(124, 58, 237, 0.4)',
      },
      borderRadius: {
        'nexify': '0.5rem',
      },
    },
  },
  plugins: [],
};
