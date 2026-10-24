import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        primary: '#E85D2A',
        success: '#22C55E',
        dark: '#0d0d0d',
        fg: '#0d0d0d',
        surface: '#ffffff',
        muted: {
          DEFAULT: '#F5F5F5',
          fg: '#525252',
        },
        border: '#e5e7eb',
      },
    },
  },
  plugins: [],
};

export default config;
