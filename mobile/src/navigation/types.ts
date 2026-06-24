import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Navigator — hosts the onboarding flow, the tab shell, and the
// modal Lesson Player presented over the tabs (see docs/design/screens.md).
export type RootStackParamList = {
  Onboarding?: NavigatorScreenParams<OnboardingStackParamList>;
  Main?: NavigatorScreenParams<MainTabParamList>;
  // Lesson Player presents as a modal stack over the tabs. A real Lesson id is
  // wired in a later issue; optional here so the placeholder can be opened bare.
  LessonPlayer: NavigatorScreenParams<LessonPlayerStackParamList>;

  // --- Existing boilerplate / design-system demo routes (kept reachable) ---
  Settings: undefined;
  ComponentsDemo: undefined;
  DesignSystem: undefined;
  AvatarDemo: undefined;
  BadgeDemo: undefined;
  ChipDemo: undefined;
  CheckboxDemo: undefined;
  ProgressBarDemo: undefined;
  AppButtonDemo: undefined;
  SliderDemo: undefined;
  SwitchDemo: undefined;
  SelectDemo: undefined;
  AppTextDemo: undefined;
  Login: undefined;
  Register: undefined;
  About: undefined;
};

// Main Tab Navigator — the four Inflow tabs: Học / Tạo / Thử thách / Hồ sơ.
export type MainTabParamList = {
  LEARN: undefined; // Học (Home)
  CREATE: undefined; // Tạo (Import)
  CHALLENGE: undefined; // Thử thách (Challenge Feed)
  PROFILE: undefined; // Hồ sơ (Stats)
};

// Onboarding Stack — Welcome → Topics → Reading Level → Golden First Lesson →
// Result + Daily Goal → Sign up → Push priming (docs/design/screens.md §1–7).
export type OnboardingStackParamList = {
  Welcome: undefined;
  Topics: undefined;
  ReadingLevel: undefined;
  GoldenFirstLesson: undefined;
  Result: undefined;
  SignUp: undefined;
  PushPriming: undefined;
};

// Lesson Player Stack — the modal study surface (Reading / Listening Replay,
// Item cards, consolidation, completion). Placeholder for now.
export type LessonPlayerStackParamList = {
  Player: { lessonId?: string } | undefined;
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OnboardingStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type LessonPlayerStackScreenProps<T extends keyof LessonPlayerStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<LessonPlayerStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
