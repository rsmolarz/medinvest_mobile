/**
 * MedInvest Color Palette
 * Medical blue meets financial confidence
 * "Bloomberg meets Apple Health" aesthetic
 */

export const colors = {
  // Primary Colors
  primary: {
    main: '#0066CC',      // Medical Blue - Main actions, active states
    light: '#3385D6',
    dark: '#004C99',
    contrast: '#FFFFFF',
  },

  // Secondary Colors  
  secondary: {
    main: '#00A86B',      // Investment Green - Success, gains
    light: '#33BA89',
    dark: '#007A4D',
    contrast: '#FFFFFF',
  },

  // Gradient (Healthcare-Finance Bridge)
  gradient: {
    start: '#0066CC',     // Medical Blue
    end: '#00A86B',       // Investment Green
    // CSS gradient string
    primary: 'linear-gradient(135deg, #0066CC 0%, #00A86B 100%)',
    // For React Native
    colors: ['#0066CC', '#00A86B'] as const,
    locations: [0, 1] as const,
  },

  // Background Colors
  background: {
    primary: '#F8F9FA',   // Main background
    secondary: '#F1F3F5',
    tertiary: '#E9ECEF',
  },

  // Surface Colors
  surface: {
    primary: '#FFFFFF',   // Cards, modals
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#0066CC',
  },

  // Semantic Colors
  semantic: {
    success: '#00A86B',   // Same as secondary - gains
    error: '#DC2626',     // Losses, validation errors
    warning: '#F59E0B',   // Risk indicators
    info: '#0066CC',      // Same as primary
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Chart Colors (for portfolio graphs)
  chart: {
    positive: '#00A86B',
    negative: '#DC2626',
    neutral: '#6B7280',
    line: '#0066CC',
    area: 'rgba(0, 102, 204, 0.1)',
  },

  // Status Colors
  status: {
    active: '#00A86B',
    pending: '#F59E0B',
    completed: '#0066CC',
    failed: '#DC2626',
  },

  // Transparent variants
  transparent: {
    primary10: 'rgba(0, 102, 204, 0.1)',
    primary20: 'rgba(0, 102, 204, 0.2)',
    secondary10: 'rgba(0, 168, 107, 0.1)',
    secondary20: 'rgba(0, 168, 107, 0.2)',
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white50: 'rgba(255, 255, 255, 0.5)',
  },
} as const;

export type ColorPalette = typeof colors;
