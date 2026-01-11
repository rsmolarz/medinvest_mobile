import { Platform, TextStyle } from 'react-native';

/**
 * MedInvest Typography System
 * Font: System (SF Pro for iOS, Roboto for Android)
 * Professional yet approachable
 */

// Font families based on platform
const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    semibold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

// Font weights
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Line height multipliers
const lineHeightMultipliers = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

/**
 * Typography Scale
 * Based on design guidelines:
 * - Hero: 32pt, Bold
 * - Title: 24pt, Bold  
 * - Heading: 18pt, Semibold
 * - Body: 16pt, Regular
 * - Caption: 14pt, Regular
 * - Small: 12pt, Regular
 */
export const typography = {
  // Hero - Large feature text, portfolio totals
  hero: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamily.bold,
    lineHeight: 32 * lineHeightMultipliers.tight,
    letterSpacing: -0.5,
  } as TextStyle,

  // Title - Screen titles, card headers
  title: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamily.bold,
    lineHeight: 24 * lineHeightMultipliers.tight,
    letterSpacing: -0.3,
  } as TextStyle,

  // Heading - Section headers, list item titles
  heading: {
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamily.semibold,
    lineHeight: 18 * lineHeightMultipliers.normal,
    letterSpacing: -0.2,
  } as TextStyle,

  // Body - Main content text
  body: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamily.regular,
    lineHeight: 16 * lineHeightMultipliers.relaxed,
    letterSpacing: 0,
  } as TextStyle,

  // Body Medium - Emphasized body text
  bodyMedium: {
    fontSize: 16,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamily.medium,
    lineHeight: 16 * lineHeightMultipliers.relaxed,
    letterSpacing: 0,
  } as TextStyle,

  // Caption - Secondary info, timestamps
  caption: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamily.regular,
    lineHeight: 14 * lineHeightMultipliers.normal,
    letterSpacing: 0.1,
  } as TextStyle,

  // Caption Medium - Emphasized captions
  captionMedium: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamily.medium,
    lineHeight: 14 * lineHeightMultipliers.normal,
    letterSpacing: 0.1,
  } as TextStyle,

  // Small - Labels, badges, fine print
  small: {
    fontSize: 12,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamily.regular,
    lineHeight: 12 * lineHeightMultipliers.normal,
    letterSpacing: 0.2,
  } as TextStyle,

  // Small Medium - Emphasized small text
  smallMedium: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamily.medium,
    lineHeight: 12 * lineHeightMultipliers.normal,
    letterSpacing: 0.2,
  } as TextStyle,

  // Button text styles
  button: {
    large: {
      fontSize: 18,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamily.semibold,
      lineHeight: 18 * lineHeightMultipliers.tight,
      letterSpacing: 0.3,
    } as TextStyle,
    medium: {
      fontSize: 16,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamily.semibold,
      lineHeight: 16 * lineHeightMultipliers.tight,
      letterSpacing: 0.2,
    } as TextStyle,
    small: {
      fontSize: 14,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamily.semibold,
      lineHeight: 14 * lineHeightMultipliers.tight,
      letterSpacing: 0.2,
    } as TextStyle,
  },

  // Number styles (for financial data)
  number: {
    large: {
      fontSize: 32,
      fontWeight: fontWeights.bold,
      fontFamily: fontFamily.bold,
      lineHeight: 32 * lineHeightMultipliers.tight,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    medium: {
      fontSize: 24,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamily.semibold,
      lineHeight: 24 * lineHeightMultipliers.tight,
      letterSpacing: -0.3,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    small: {
      fontSize: 16,
      fontWeight: fontWeights.medium,
      fontFamily: fontFamily.medium,
      lineHeight: 16 * lineHeightMultipliers.tight,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
  },

  // Percentage styles (for gains/losses)
  percentage: {
    large: {
      fontSize: 18,
      fontWeight: fontWeights.semibold,
      fontFamily: fontFamily.semibold,
      lineHeight: 18 * lineHeightMultipliers.tight,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    small: {
      fontSize: 14,
      fontWeight: fontWeights.medium,
      fontFamily: fontFamily.medium,
      lineHeight: 14 * lineHeightMultipliers.tight,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
  },
} as const;

export type Typography = typeof typography;
