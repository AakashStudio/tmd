export const theme = {
  colors: {
    primary: '#E91E63',        // Hot Pink / Magenta
    primaryDark: '#C2185B',
    primaryLight: '#F48FB1',
    accent: '#FF6F61',         // Coral / Rose
    accentLight: '#FF8A80',
    background: '#0A0A0A',     // Near Black
    surface: '#1A1A1A',        // Dark Charcoal (cards)
    surfaceLight: '#252525',
    surfaceHover: '#2A2A2A',
    textPrimary: '#FFFFFF',
    textSecondary: '#9E9E9E',  // Soft Gray
    textMuted: '#616161',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    border: '#2E2E2E',
    borderLight: '#3A3A3A',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',   // MAX - never exceed
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  font: {
    family: '"Oracle Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
  },
} as const;

export type Theme = typeof theme;
