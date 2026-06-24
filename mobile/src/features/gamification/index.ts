/**
 * Gamification feature — the progress/motivation layer (issue #14): the two-tier
 * **Celebration**, the shareable **Milestone Card**, automatic **Level up**
 * moments, and the light **SRS** quick review. Public surface of the feature.
 */

export {
  detectMilestones,
  primaryMilestone,
  STREAK_MILESTONES,
  NORTH_STAR_STEP,
} from './milestones';
export type {Milestone, LevelSkill, GamificationSnapshot} from './milestones';

export {
  todayKey,
  previousDayKey,
  advanceStreak,
  isGoalMet,
  progressInUnit,
} from './dailyGoal';
export type {DayKey, StreakState, StreakAdvance, CompletionContribution} from './dailyGoal';

export {selectQuickReview, QUICK_REVIEW_SIZE} from './srs';
export type {QuickReviewPrompt} from './srs';

export {milestoneDisplay} from './milestoneDisplay';
export type {MilestoneDisplay, MilestoneTone} from './milestoneDisplay';

export {default as CelebrationView} from './components/CelebrationView';
export {default as MilestoneCard} from './components/MilestoneCard';
export {default as LevelUpView} from './components/LevelUpView';
export {default as ProfileView} from './components/ProfileView';
export {default as QuickReviewView} from './components/QuickReviewView';
