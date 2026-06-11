import type { Config } from 'tailwindcss'

// Figma-inspired design system. See web-ui/DESIGN.md.
// Monochrome chrome + oversized pastel color-block sections.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mono core
        ink: 'hsl(var(--ink) / <alpha-value>)',
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        'inverse-canvas': 'hsl(var(--inverse-canvas) / <alpha-value>)',
        'inverse-ink': 'hsl(var(--inverse-ink) / <alpha-value>)',

        // Surface
        'surface-soft': 'hsl(var(--surface-soft) / <alpha-value>)',
        hairline: 'hsl(var(--hairline) / <alpha-value>)',
        'hairline-soft': 'hsl(var(--hairline-soft) / <alpha-value>)',

        // Color-block palette (signature)
        'block-lime':   'hsl(var(--block-lime) / <alpha-value>)',
        'block-lilac':  'hsl(var(--block-lilac) / <alpha-value>)',
        'block-cream':  'hsl(var(--block-cream) / <alpha-value>)',
        'block-mint':   'hsl(var(--block-mint) / <alpha-value>)',
        'block-pink':   'hsl(var(--block-pink) / <alpha-value>)',
        'block-coral':  'hsl(var(--block-coral) / <alpha-value>)',
        'block-navy':   'hsl(var(--block-navy) / <alpha-value>)',

        // Accent (single-shot promo)
        'accent-magenta': 'hsl(var(--accent-magenta) / <alpha-value>)',

        // Semantic
        'semantic-success': 'hsl(var(--semantic-success) / <alpha-value>)',

        // Legacy aliases — remap to mono palette so un-migrated components stay on-brand.
        bg: {
          '000': 'hsl(var(--canvas) / <alpha-value>)',
          '100': 'hsl(var(--canvas) / <alpha-value>)',
          '200': 'hsl(var(--surface-soft) / <alpha-value>)',
          '300': 'hsl(var(--surface-soft) / <alpha-value>)',
          '400': 'hsl(var(--hairline-soft) / <alpha-value>)',
          '500': 'hsl(var(--hairline-soft) / <alpha-value>)',
        },
        text: {
          '000': 'hsl(var(--ink) / <alpha-value>)',
          '100': 'hsl(var(--ink) / <alpha-value>)',
          '200': 'hsl(var(--ink) / <alpha-value>)',
          '300': 'hsl(var(--ink) / <alpha-value>)',
          '400': 'hsl(var(--ink) / <alpha-value>)',
          '500': 'hsl(var(--ink) / <alpha-value>)',
        },
        border: {
          '100': 'hsl(var(--hairline) / <alpha-value>)',
          '200': 'hsl(var(--hairline) / <alpha-value>)',
          '300': 'hsl(var(--hairline-soft) / <alpha-value>)',
          '400': 'hsl(var(--hairline-soft) / <alpha-value>)',
        },
        accent: {
          main: {
            '100': 'hsl(var(--ink) / <alpha-value>)',
            '200': 'hsl(var(--ink) / <alpha-value>)',
          },
          secondary: {
            '100': 'hsl(var(--ink) / <alpha-value>)',
            '900': 'hsl(var(--hairline-soft) / <alpha-value>)',
          },
        },
        danger: {
          '000': 'hsl(var(--block-coral) / <alpha-value>)',
          '100': 'hsl(var(--block-coral) / <alpha-value>)',
        },
        success: {
          '000': 'hsl(var(--semantic-success) / <alpha-value>)',
          '100': 'hsl(var(--semantic-success) / <alpha-value>)',
        },
        warning: {
          '100': 'hsl(var(--block-coral) / <alpha-value>)',
        },
        gray: {
          50:  'hsl(var(--canvas))',
          100: 'hsl(var(--surface-soft))',
          200: 'hsl(var(--hairline-soft))',
          300: 'hsl(var(--hairline-soft))',
          400: 'hsl(var(--ink))',
          500: 'hsl(var(--ink))',
          600: 'hsl(var(--ink))',
          700: 'hsl(var(--ink))',
          800: 'hsl(var(--ink))',
          900: 'hsl(var(--ink))',
        },
      },
      borderRadius: {
        xs: '2px',
        sm: '6px',
        md: '8px',
        lg: '24px',
        xl: '32px',
        pill: '50px',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'Helvetica', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Figma typography tokens — [size, { lineHeight, letterSpacing, fontWeight }]
        'display-xl': ['86px', { lineHeight: '1.00', letterSpacing: '-1.72px', fontWeight: '340' }],
        'display-lg': ['64px', { lineHeight: '1.10', letterSpacing: '-0.96px', fontWeight: '340' }],
        'headline':   ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '540' }],
        'subhead':    ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '340' }],
        'card-title': ['24px', { lineHeight: '1.45', letterSpacing: '0',       fontWeight: '700' }],
        'body-lg':    ['20px', { lineHeight: '1.40', letterSpacing: '-0.14px', fontWeight: '330' }],
        'body':       ['18px', { lineHeight: '1.45', letterSpacing: '-0.26px', fontWeight: '320' }],
        'body-sm':    ['16px', { lineHeight: '1.45', letterSpacing: '-0.14px', fontWeight: '330' }],
        'link':       ['20px', { lineHeight: '1.40', letterSpacing: '-0.10px', fontWeight: '480' }],
        'btn':        ['20px', { lineHeight: '1.40', letterSpacing: '-0.10px', fontWeight: '480' }],
        'eyebrow':    ['18px', { lineHeight: '1.30', letterSpacing: '0.54px',  fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '1.00', letterSpacing: '0.60px',  fontWeight: '400' }],
      },
      spacing: {
        'xxs': '4px',
        'xxl': '48px',
        'section': '96px',
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '4.5xl': '58rem',
        'content': '1280px',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'border-breathe': 'border-breathe 2.5s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'content-fade': 'content-fade 0.15s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.04' },
          '50%': { opacity: '0.10' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-breathe': {
          '0%, 100%': { borderLeftColor: 'hsl(var(--ink) / 0.4)' },
          '50%': { borderLeftColor: 'hsl(var(--ink) / 1)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.4)', opacity: '1' },
        },
        'content-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
