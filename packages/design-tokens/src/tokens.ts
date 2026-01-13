/**
 * Navo Design System - Unified Design Tokens
 * 
 * Single source of truth for colors, typography, spacing across all apps.
 * Import in any app: import { colors, typography } from '@navo/design-tokens'
 */

// ===========================================
// Brand Colors
// ===========================================

export const colors = {
  // Primary - Navy (Maritime Trust)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#1e40af',  // Main primary
    600: '#1e3a8a',
    700: '#1e3a8a',
    800: '#1e3a8a',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Secondary - Teal (Ocean)
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#0d9488',  // Main secondary
    600: '#0f766e',
    700: '#115e59',
    800: '#134e4a',
    900: '#042f2e',
  },
  
  // Accent - Gold (Premium)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#d97706',  // Main accent
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },
  
  // Semantic Colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },
  
  // Neutrals
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

// ===========================================
// Typography
// ===========================================

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ===========================================
// Spacing
// ===========================================

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

// ===========================================
// Shadows
// ===========================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const;

// ===========================================
// Border Radius
// ===========================================

export const radius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

// ===========================================
// Z-Index
// ===========================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  tooltip: 1400,
  toast: 1500,
} as const;

// ===========================================
// Animation
// ===========================================

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ===========================================
// Breakpoints
// ===========================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===========================================
// App-Specific Themes
// ===========================================

export const appThemes = {
  // Key App - Full operations (Navy + Gold accents)
  key: {
    primary: colors.primary[500],
    secondary: colors.accent[500],
    background: colors.gray[50],
    surface: '#ffffff',
    text: colors.gray[900],
    textMuted: colors.gray[500],
  },
  
  // Portal App - Customer facing (Navy + Teal)
  portal: {
    primary: colors.primary[500],
    secondary: colors.secondary[500],
    background: colors.gray[50],
    surface: '#ffffff',
    text: colors.gray[900],
    textMuted: colors.gray[500],
  },
  
  // Vendor App - Service providers (Teal + Navy)
  vendor: {
    primary: colors.secondary[600],
    secondary: colors.primary[500],
    background: colors.gray[50],
    surface: '#ffffff',
    text: colors.gray[900],
    textMuted: colors.gray[500],
  },
  
  // WWW - Marketing site (Navy + Gold + Teal)
  www: {
    primary: colors.primary[600],
    secondary: colors.accent[500],
    accent: colors.secondary[500],
    background: '#ffffff',
    surface: colors.gray[50],
    text: colors.gray[900],
    textMuted: colors.gray[600],
  },
} as const;

// Type exports
export type Colors = typeof colors;
export type Typography = typeof typography;
export type AppTheme = keyof typeof appThemes;
