// Theme configuration
import COLORS from './colors';
import { BORDER_RADIUS, SHADOW, SPACING } from './spacing';
import TYPOGRAPHY from './typography';

export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadow: SHADOW,
  
  // Common dimensions
  screenPadding: SPACING.lg,
  headerHeight: 60,
  tabBarHeight: 60,
  inputHeight: 48,
  buttonHeight: 48,
  
  // Common styles
  safeAreaBackgroundColor: COLORS.white,
};

export { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOW };
export default THEME;