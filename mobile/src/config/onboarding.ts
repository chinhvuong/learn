/**
 * Onboarding static catalogs — topics for the Interest Profile, CEFR Reading
 * Level options, and Daily Goal presets. Mirrors the design handoff
 * (Inflow.dc.html screens 02/03/05) verbatim; copy stays Vietnamese.
 */

/** CEFR band, displayed front-facing per CONTEXT.md "Level". */
export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** Ordered CEFR ladder used to seed Listening Level as Reading − 1 band. */
export const CEFR_LADDER: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Seed the Listening Level one band below the chosen Reading Level (never
 * below A1). CONTEXT.md: reading proficiency commonly outpaces listening, so
 * Listening is not asked at onboarding and self-corrects later.
 */
export function seedListeningBand(reading: CefrBand): CefrBand {
  const index = CEFR_LADDER.indexOf(reading);
  if (index <= 0) return 'A1';
  return CEFR_LADDER[index - 1];
}

/** A selectable interest topic (seeds the Interest Profile at cold start). */
export interface OnboardingTopic {
  id: string;
  emoji: string;
  /** i18n key for the Vietnamese label. */
  labelKey: string;
}

/** Topics from the handoff interest picker (screen 02). */
export const ONBOARDING_TOPICS: OnboardingTopic[] = [
  {id: 'tech', emoji: '💻', labelKey: 'ONBOARDING_TOPIC_TECH'},
  {id: 'travel', emoji: '✈️', labelKey: 'ONBOARDING_TOPIC_TRAVEL'},
  {id: 'sports', emoji: '⚽', labelKey: 'ONBOARDING_TOPIC_SPORTS'},
  {id: 'movies', emoji: '🎬', labelKey: 'ONBOARDING_TOPIC_MOVIES'},
  {id: 'science', emoji: '🔬', labelKey: 'ONBOARDING_TOPIC_SCIENCE'},
  {id: 'business', emoji: '💼', labelKey: 'ONBOARDING_TOPIC_BUSINESS'},
  {id: 'music', emoji: '🎵', labelKey: 'ONBOARDING_TOPIC_MUSIC'},
  {id: 'food', emoji: '🍳', labelKey: 'ONBOARDING_TOPIC_FOOD'},
  {id: 'psychology', emoji: '🧠', labelKey: 'ONBOARDING_TOPIC_PSYCHOLOGY'},
  {id: 'news', emoji: '📰', labelKey: 'ONBOARDING_TOPIC_NEWS'},
];

/** Minimum topics required before the learner can continue (handoff: "Chọn ít nhất 3"). */
export const MIN_TOPICS = 3;

/**
 * A Reading Level self-select option. `band: null` is the "let the app figure
 * it out" path (handoff "Chưa chắc" → app probes over the first Lessons).
 */
export interface ReadingLevelOption {
  /** Stable id used for selection state. */
  id: string;
  /** The CEFR band, or null for the "let the app decide" option. */
  band: CefrBand | null;
  /** i18n key for the heading (e.g. "A2", "Chưa chắc"). */
  titleKey: string;
  /** i18n key for the plain-language example. */
  exampleKey: string;
}

/** Reading Level options from the handoff (screen 03). */
export const READING_LEVEL_OPTIONS: ReadingLevelOption[] = [
  {id: 'a2', band: 'A2', titleKey: 'ONBOARDING_LEVEL_A2', exampleKey: 'ONBOARDING_LEVEL_A2_EXAMPLE'},
  {id: 'b1', band: 'B1', titleKey: 'ONBOARDING_LEVEL_B1', exampleKey: 'ONBOARDING_LEVEL_B1_EXAMPLE'},
  {id: 'b2', band: 'B2', titleKey: 'ONBOARDING_LEVEL_B2', exampleKey: 'ONBOARDING_LEVEL_B2_EXAMPLE'},
  {id: 'unsure', band: null, titleKey: 'ONBOARDING_LEVEL_UNSURE', exampleKey: 'ONBOARDING_LEVEL_UNSURE_EXAMPLE'},
];

/** A Daily Goal preset (handoff screen 05 — ~5 / ~10 / ~20 minutes). */
export interface DailyGoalPreset {
  id: string;
  /** Minutes per day target. */
  minutes: number;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
}

/** Daily Goal presets; "regular" (~10') is the handoff default. */
export const DAILY_GOAL_PRESETS: DailyGoalPreset[] = [
  {id: 'light', minutes: 5, emoji: '☕', titleKey: 'ONBOARDING_GOAL_LIGHT', subtitleKey: 'ONBOARDING_GOAL_LIGHT_SUB'},
  {id: 'regular', minutes: 10, emoji: '🔥', titleKey: 'ONBOARDING_GOAL_REGULAR', subtitleKey: 'ONBOARDING_GOAL_REGULAR_SUB'},
  {id: 'serious', minutes: 20, emoji: '🚀', titleKey: 'ONBOARDING_GOAL_SERIOUS', subtitleKey: 'ONBOARDING_GOAL_SERIOUS_SUB'},
];

export const DEFAULT_DAILY_GOAL_MINUTES = 10;
