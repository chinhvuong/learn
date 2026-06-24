import {AppColors, AppColorsLight} from "../config/colors.ts";
import {useTheme} from "@/hooks/useTheme.ts";

/**
 * Returns the active Inflow token set (light or dark), resolved from the
 * learner's theme preference (incl. live `system` following).
 */
export function useColors() {
  const {theme} = useTheme();
  if (theme === 'light') return AppColorsLight;
  return AppColors;
}
