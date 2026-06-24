import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

// Onboarding Stack Navigator (Welcome → Topics → Reading Level → Golden First Lesson …)
export type OnboardingStackParamList = {
  Welcome: undefined;
};

// Main Tab Navigator — the four Inflow tabs (screens.md "Navigation model").
export type MainTabParamList = {
  Learn: undefined;     // Học (Home)
  Create: undefined;    // Tạo
  Challenge: undefined; // Thử thách
  Profile: undefined;   // Hồ sơ
};

// Root Stack Navigator — hosts onboarding, the tab shell, and the modal
// Lesson Player presented over the tabs.
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main?: NavigatorScreenParams<MainTabParamList>;
  LessonPlayer: {lessonId?: string} | undefined;
  // Legacy boilerplate / design-system demo routes (kept reachable).
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

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

// Navigation prop used inside the onboarding stack (so screens can reach the
// root via getParent() to hand off into the tab shell or the Lesson Player).
export type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

// Navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
