import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {LanguageCode} from '@/config/i18n';

/** The resolved appearance actually rendered. */
export type Theme = 'light' | 'dark';
/** The learner's theme preference: a fixed appearance, or follow the system. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Insets {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Get device language


interface AppState {
  /** Learner preference — may be `system` (follow OS appearance). */
  themePreference: ThemePreference;
  language: LanguageCode;
  insets: Insets;
  isFirstLaunch: boolean;
  isLoading: boolean;
  /**
   * Whether reading tokens show their Item-type encoding (underlines/pills).
   * Mirrors the handoff's `showAnnotations` flag. Default true.
   */
  showAnnotations: boolean;
  /**
   * Use the Newsreader serif on the reading surface (vs. the UI sans).
   * Mirrors the handoff's `readingSerif` flag. Default true.
   */
  readingSerif: boolean;
}

const initialState: AppState = {
  themePreference: 'system',
  // Inflow's UI is Vietnamese (English appears only as Lesson content), so the
  // app defaults to Vietnamese rather than the device locale.
  language: 'vi',
  insets: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  isFirstLaunch: true,
  isLoading: false,
  showAnnotations: true,
  readingSerif: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setThemePreference: (state, action: PayloadAction<ThemePreference>) => {
      state.themePreference = action.payload;
    },
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.language = action.payload;
    },
    setInsets: (state, action: PayloadAction<Insets>) => {
      state.insets = action.payload;
    },
    setIsFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setShowAnnotations: (state, action: PayloadAction<boolean>) => {
      state.showAnnotations = action.payload;
    },
    setReadingSerif: (state, action: PayloadAction<boolean>) => {
      state.readingSerif = action.payload;
    },
    /**
     * Cycle the theme preference light → dark → system → light.
     * Resolution to an actual appearance (incl. live system following) happens
     * in `useTheme`, so the OS theme never gets baked into persisted state.
     */
    cycleThemePreference: (state) => {
      state.themePreference =
        state.themePreference === 'light'
          ? 'dark'
          : state.themePreference === 'dark'
            ? 'system'
            : 'light';
    },
  },
});

export const {
  setThemePreference,
  setLanguage,
  setInsets,
  setIsFirstLaunch,
  setIsLoading,
  setShowAnnotations,
  setReadingSerif,
  cycleThemePreference,
} = appSlice.actions;
export default appSlice.reducer;
