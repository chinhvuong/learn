import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {Milestone} from '@/features/gamification/milestones';
import type {QuickReviewPrompt} from '@/features/gamification/srs';

// Onboarding Stack Navigator — the value-before-signup first run
// (screens.md "ONBOARDING"): Welcome → Topics → Reading Level → Golden First
// Lesson (the root LessonPlayer, run before signup) → Result + Daily Goal →
// Sign up → Push priming. The Golden First Lesson itself lives on the root
// stack (LessonPlayer), so it isn't a member here.
export type OnboardingStackParamList = {
  Welcome: undefined;
  Topics: undefined;
  ReadingLevel: undefined;
  Result: undefined;
  Signup: undefined;
  PushPriming: undefined;
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
  // `onboarding: true` marks the Golden First Lesson launched from the
  // onboarding Reading Level step — on completion the Player hands back to the
  // Onboarding "Result" recap (Result → Signup → Push → Main) instead of the
  // core-loop Lesson-complete view (PRD stories 6–8; OnboardingStackNavigator).
  LessonPlayer: {lessonId?: string; onboarding?: boolean} | undefined;
  // Full-screen major-milestone Celebration (Streak / Level up / round North
  // Star) — reachable from completion and from tapping a Profile trophy. The
  // milestone is a plain serializable object (issue #14, screens.md §12/§14b).
  Celebration: {milestone: Milestone};
  // Optional 60-second quick review (light SRS) — opened from the Lesson-complete
  // exits. Carries the selected prompts (Item + answer); never a due-queue, no
  // red debt badge (CONTEXT.md → "SRS"; issue #14).
  QuickReview: {prompts: QuickReviewPrompt[]};
  // My Library (Thư viện của tôi) — the learner's own Lessons, grouped
  // (screens.md §08b; design node y5RJTT). Reached from the Home "Thư viện của
  // tôi" row, presented over the tab shell.
  MyLibrary: undefined;
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
