/**
 * MedInvest Theme
 * Central export for all design tokens
 * 
 * "Bloomberg meets Apple Health" - Professional, trustworthy,
 * medical blue meets financial confidence
 */

export { colors } from './colors';
export type { ColorPalette } from './colors';

export { typography, fontWeights } from './typography';
export type { Typography } from './typography';

export { 
  spacing, 
  layout, 
  borders, 
  shadows, 
  zIndex 
} from './spacing';
export type { Spacing, Layout, Shadows } from './spacing';

// Combined theme object for convenience
import { colors } from './colors';
import { typography, fontWeights } from './typography';
import { spacing, layout, borders, shadows, zIndex } from './spacing';

export const theme = {
  colors,
  typography,
  fontWeights,
  spacing,
  layout,
  borders,
  shadows,
  zIndex,
} as const;

export type Theme = typeof theme;

// Default export
export default theme;
