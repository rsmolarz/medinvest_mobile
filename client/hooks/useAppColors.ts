import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";

export function useAppColors() {
  const { isDark, colors: themeColors } = useThemeContext();
  const palette = Colors[isDark ? "dark" : "light"];

  return {
    primary: Colors.primary,
    secondary: Colors.secondary,
    gradient: Colors.gradient,
    error: isDark ? '#E57373' : Colors.error,
    warning: isDark ? '#FFD54F' : Colors.warning,

    background: palette.backgroundRoot,
    surface: palette.backgroundDefault,
    surfaceSecondary: palette.backgroundSecondary,
    surfaceTertiary: palette.backgroundTertiary,
    textPrimary: palette.text,
    textSecondary: palette.textSecondary,
    border: isDark ? '#3D3D3D' : Colors.border,
    borderLight: isDark ? '#2D2D2D' : '#F0F2F4',
    divider: isDark ? '#3D3D3D' : '#E8EAED',
    card: palette.backgroundDefault,
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    tabBar: palette.backgroundDefault,
    input: isDark ? '#2D2D2D' : '#F5F7FA',
    inputFocused: isDark ? '#3D3D3D' : '#FFFFFF',

    isDark,
  };
}
