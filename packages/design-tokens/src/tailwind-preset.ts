import { colors, typography, shadows, radius, animation } from './tokens';

/**
 * Navo Tailwind CSS Preset
 *
 * Use in tailwind.config.ts:
 * import navoPreset from '@navo/design-tokens/tailwind'
 * export default { presets: [navoPreset], ... }
 */

const navoPreset = {
  theme: {
    extend: {
      // CSS Variable-based colors (shadcn/ui compatible)
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Navo brand colors (direct hex for explicit use)
        navy: colors.primary,
        teal: colors.secondary,
        gold: colors.accent,
        gray: colors.gray,
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },

      boxShadow: shadows,
      transitionDuration: animation.duration,
      transitionTimingFunction: animation.easing,

      // Maritime-specific gradients
      backgroundImage: {
        'gradient-ocean': 'linear-gradient(135deg, hsl(224 76% 40%) 0%, hsl(173 58% 39%) 100%)',
        'gradient-sunset': 'linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(224 76% 40%) 100%)',
        'gradient-depth': 'linear-gradient(180deg, hsl(222 47% 5%) 0%, hsl(224 76% 40%) 100%)',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
    },
  },

  plugins: [],
} as const;

export default navoPreset;
