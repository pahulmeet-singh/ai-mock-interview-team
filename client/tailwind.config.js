import animate from 'tailwindcss-animate';

// Design tokens are CSS variables (see src/index.css); Tailwind maps them to utility classes so a colour is
// changed in exactly one place.
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Instrument Sans Variable"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('foreground') },
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: { DEFAULT: token('secondary'), foreground: token('foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        success: token('success'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
      },
      borderRadius: { xl: 'var(--radius)', lg: 'calc(var(--radius) - 4px)', md: 'calc(var(--radius) - 6px)', sm: 'calc(var(--radius) - 8px)' },
      keyframes: {
        'tick-in': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'tick-in': 'tick-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up': 'fade-up 320ms ease-out both',
      },
    },
  },
  plugins: [animate],
};
