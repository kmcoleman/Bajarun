/**
 * NorCal Moto Adventure - Design System
 * Based on Stitch UI mockups
 */

// Color palette
export const colors = {
  // Primary brand colors
  accent: '#2563eb',        // Primary blue
  accentLight: '#3b82f6',   // Lighter blue for hover/active
  accentDark: '#1d4ed8',    // Darker blue

  // Status colors
  success: '#22c55e',
  successDark: '#16a34a',
  warning: '#f59e0b',
  warningDark: '#d97706',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  info: '#06b6d4',
  infoDark: '#0891b2',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
};

// Theme definitions
export const themes = {
  dark: {
    // Backgrounds
    background: '#0a1628',
    backgroundSecondary: '#0f1f35',
    card: '#1a2744',
    cardHover: '#1e2d4d',
    cardBorder: '#2a3a5a',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#0f172a',

    // Accents
    accent: colors.accent,
    accentLight: colors.accentLight,

    // Status
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,

    // Tab bar
    tabBar: '#0a1628',
    tabBarBorder: '#1a2744',
    tabIconDefault: '#64748b',
    tabIconSelected: colors.accent,

    // Inputs
    inputBackground: '#1a2744',
    inputBorder: '#2a3a5a',
    inputBorderFocus: colors.accent,
    inputPlaceholder: '#64748b',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1a2744',
  },
  light: {
    // Backgrounds
    background: '#f8fafc',
    backgroundSecondary: '#f1f5f9',
    card: '#ffffff',
    cardHover: '#f8fafc',
    cardBorder: '#e2e8f0',

    // Text
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textInverse: '#ffffff',

    // Accents
    accent: colors.accent,
    accentLight: colors.accentLight,

    // Status
    success: colors.successDark,
    warning: colors.warningDark,
    danger: colors.dangerDark,
    info: colors.infoDark,

    // Tab bar
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabIconDefault: '#94a3b8',
    tabIconSelected: colors.accent,

    // Inputs
    inputBackground: '#ffffff',
    inputBorder: '#e2e8f0',
    inputBorderFocus: colors.accent,
    inputPlaceholder: '#94a3b8',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#ffffff',
  },
};

// Typography scale
export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// Spacing scale (4px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Shadows (for light mode primarily)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Icon sizes
export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Type exports
export type ThemeMode = 'light' | 'dark';
export type Theme = typeof themes.dark;
export type TypographyVariant = keyof typeof typography;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
