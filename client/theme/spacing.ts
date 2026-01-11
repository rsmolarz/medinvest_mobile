/**
 * MedInvest Spacing System
 * Consistent spacing throughout the app
 * Base unit: 4px
 */

// Base spacing unit
const BASE_UNIT = 4;

/**
 * Spacing scale using 4px base
 * - xs: 4px
 * - sm: 8px
 * - md: 12px
 * - lg: 16px
 * - xl: 24px
 * - 2xl: 32px
 * - 3xl: 48px
 * - 4xl: 64px
 */
export const spacing = {
  /** 4px */
  xs: BASE_UNIT,
  /** 8px */
  sm: BASE_UNIT * 2,
  /** 12px */
  md: BASE_UNIT * 3,
  /** 16px */
  lg: BASE_UNIT * 4,
  /** 24px */
  xl: BASE_UNIT * 6,
  /** 32px */
  '2xl': BASE_UNIT * 8,
  /** 48px */
  '3xl': BASE_UNIT * 12,
  /** 64px */
  '4xl': BASE_UNIT * 16,
} as const;

/**
 * Layout-specific spacing
 */
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing.lg,
  screenPaddingVertical: spacing.xl,

  // Card padding
  cardPadding: spacing.lg,
  cardPaddingLarge: spacing.xl,

  // Section spacing
  sectionGap: spacing.xl,
  itemGap: spacing.md,

  // Header heights
  headerHeight: 56,
  tabBarHeight: 84, // Including bottom safe area typically

  // FAB dimensions
  fabSize: 56,
  fabBottomOffset: 16,

  // Input heights
  inputHeight: 48,
  inputHeightLarge: 56,

  // Button heights
  buttonHeightSmall: 36,
  buttonHeightMedium: 44,
  buttonHeightLarge: 52,

  // Avatar sizes
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 80,
  avatarXLarge: 120,

  // Icon sizes
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXLarge: 32,

  // Progress bar
  progressBarHeight: 8,

  // Border radius
  radiusSmall: 6,
  radiusMedium: 8,
  radiusLarge: 12,
  radiusXLarge: 16,
  radiusFull: 9999,
} as const;

/**
 * Border widths
 */
export const borders = {
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

/**
 * Shadow definitions
 */
export const shadows = {
  // Subtle shadow for cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Medium shadow for elevated elements
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Strong shadow for modals/FAB
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // FAB specific shadow (as per design guidelines)
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },

  // Bottom sheet shadow
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Z-index levels
 */
export const zIndex = {
  base: 0,
  card: 1,
  sticky: 10,
  header: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

export type Spacing = typeof spacing;
export type Layout = typeof layout;
export type Shadows = typeof shadows;
