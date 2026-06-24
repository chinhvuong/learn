import {useEffect} from 'react';
import {useColorScheme} from 'react-native';
import {colorScheme as nwColorScheme} from 'nativewind';
import {useAppSelector} from '@/store/hooks';
import type {Theme, ThemePreference} from '@/store/slices/appSlice';

export interface ResolvedTheme {
  /** The learner's stored preference (`light` | `dark` | `system`). */
  preference: ThemePreference;
  /** The appearance actually rendered after resolving `system`. */
  theme: Theme;
  isDark: boolean;
}

/**
 * Resolves the learner's theme preference into the appearance to render.
 *
 * When the preference is `system`, the OS appearance is followed live — RN's
 * `useColorScheme` re-renders on appearance change, so switching the device
 * theme re-themes the whole app immediately. The resolved value is pushed into
 * NativeWind's `colorScheme` so Tailwind `dark:`/`.dark` utilities stay in sync.
 */
export function useTheme(): ResolvedTheme {
  const preference = useAppSelector(state => state.app.themePreference);
  const systemScheme = useColorScheme();

  const theme: Theme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  useEffect(() => {
    nwColorScheme.set(theme);
  }, [theme]);

  return {preference, theme, isDark: theme === 'dark'};
}
