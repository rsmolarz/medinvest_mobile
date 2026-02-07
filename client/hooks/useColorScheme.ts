import { useThemeContext } from "@/contexts/ThemeContext";

export function useColorScheme(): "light" | "dark" {
  const { isDark } = useThemeContext();
  return isDark ? "dark" : "light";
}
