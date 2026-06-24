import React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon, ProgressBar} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useAppSelector} from '@/store/hooks';
import {scoreToCefr} from '../cefr';
import {
  selectContinueLesson,
  selectDailyGoalPercent,
  selectIsResuming,
} from '../homeSlice';
import type {HomeLessonRef} from '../homeSlice';

export interface HomeViewProps {
  /**
   * Re-enter the learning flow. Receives the Lesson "Continue" resolved to (the
   * in-progress Lesson if any, else the recommendation) so the screen stays
   * navigation-agnostic and the tab screen owns routing into the Lesson Player.
   */
  onContinue: (lesson: HomeLessonRef) => void;
  /** Open the recommended Lesson from the Discover entry. */
  onOpenRecommended?: (lesson: HomeLessonRef) => void;
}

/**
 * Home (Học) — the habit-centric root screen on every launch (screens.md §8;
 * PRD stories 12–15). Its biggest action is **Continue**: one tap re-enters the
 * learning flow, resuming an in-progress Lesson if one exists and only
 * recommending a new one when nothing is in progress.
 *
 * It surfaces the cumulative **North Star** (largest element), today's **Daily
 * Goal** progress, the **Streak**, and the two **Levels** (Reading and
 * Listening) shown separately as CEFR — reflecting that reading commonly
 * outpaces listening. All values are read live from the persisted `home` slice.
 *
 * Colors come from the theme tokens: teal (--flow) for actions/progress, amber
 * (--warm) for the North Star and Streak (Absorbed family) — no per-screen
 * hardcoded colors.
 */
export default function HomeView({onContinue, onOpenRecommended}: HomeViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const home = useAppSelector(state => state.home);

  const continueLesson = selectContinueLesson(home);
  const isResuming = selectIsResuming(home);
  const dailyGoalPercent = selectDailyGoalPercent(home);

  const readingBand = scoreToCefr(home.readingLevel);
  const listeningBand = scoreToCefr(home.listeningLevel);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Top bar: Streak · two Levels (CEFR) · Settings (screens.md §8 header) */}
      <View className="px-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          {/* Streak — amber (--warm), the Absorbed/Streak family */}
          <View className="flex-row items-center gap-1">
            <Icon name="Flame" className="text-warm w-5 h-5" />
            <AppText
              raw
              weight="bold"
              className="text-warm"
              accessibilityLabel={t('HOME_STREAK_A11Y', {count: home.streak})}>
              {String(home.streak)}
            </AppText>
          </View>

          {/* Two Levels, shown separately as CEFR (reading can outpace listening) */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <AppText raw variant="labelSmall" color="muted">
                {t('HOME_LEVEL_READING')}
              </AppText>
              <AppText raw weight="semibold" variant="label" className="text-flow">
                {readingBand}
              </AppText>
            </View>
            <AppText raw color="muted" variant="labelSmall">
              ·
            </AppText>
            <View className="flex-row items-center gap-1">
              <AppText raw variant="labelSmall" color="muted">
                {t('HOME_LEVEL_LISTENING')}
              </AppText>
              <AppText raw weight="semibold" variant="label" className="text-flow">
                {listeningBand}
              </AppText>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('TAB_PROFILE')}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center">
          <Icon name="Settings" className="text-neutrals300 w-6 h-6" />
        </Pressable>
      </View>

      {/* North Star — the cumulative Absorbed count, the LARGEST element */}
      <View className="items-center mt-8 px-6">
        <AppText
          raw
          accessibilityRole="text"
          accessibilityLabel={t('HOME_NORTH_STAR_A11Y', {
            count: home.northStar,
          })}
          className="text-warm font-sans-extrabold"
          style={{fontSize: 64, lineHeight: 72, letterSpacing: -2}}>
          {home.northStar.toLocaleString('en-US')}
        </AppText>
        <AppText raw variant="bodySmall" color="muted" className="mt-1">
          {t('HOME_NORTH_STAR_CAPTION')}
        </AppText>
        {home.absorbedToday > 0 ? (
          <AppText raw variant="labelSmall" weight="semibold" className="text-warm mt-2">
            {t('HOME_ABSORBED_TODAY', {count: home.absorbedToday})}
          </AppText>
        ) : null}
      </View>

      {/* Daily Goal — today's progress toward the self-set goal */}
      <View className="mx-6 mt-8 p-4 rounded-2xl bg-surface border border-hair">
        <View className="flex-row items-center justify-between mb-2">
          <AppText raw variant="label" weight="semibold">
            {t('HOME_DAILY_GOAL')}
          </AppText>
          <AppText raw variant="labelSmall" color="muted">
            {home.dailyGoalUnit === 'minutes'
              ? t('HOME_DAILY_GOAL_MINUTES', {
                  progress: home.dailyGoalProgress,
                  target: home.dailyGoalTarget,
                })
              : t('HOME_DAILY_GOAL_ITEMS', {
                  progress: home.dailyGoalProgress,
                  target: home.dailyGoalTarget,
                })}
          </AppText>
        </View>
        <ProgressBar
          value={dailyGoalPercent}
          variant="primary"
          size="md"
          fillClassName="bg-flow"
          trackClassName="bg-bg2"
        />
      </View>

      {/* Continue — the BIGGEST action; resumes in-progress, else recommends */}
      {continueLesson ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('HOME_CONTINUE')}
          onPress={() => onContinue(continueLesson)}
          className="mx-6 mt-6 rounded-3xl bg-flow active:opacity-90"
          style={{shadowColor: colors.flow, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: {width: 0, height: 8}, elevation: 6}}>
          <View className="p-5">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full items-center justify-center bg-on-flow/15">
                <Icon name="Play" className="text-on-flow w-7 h-7" />
              </View>
              <View className="flex-1">
                <AppText
                  raw
                  weight="bold"
                  className="text-on-flow"
                  style={{fontSize: 18, letterSpacing: 0.5}}>
                  {(isResuming
                    ? t('HOME_CONTINUE')
                    : t('HOME_START_RECOMMENDED')
                  ).toUpperCase()}
                </AppText>
                <AppText raw variant="labelSmall" className="text-on-flow/80 mt-0.5">
                  {isResuming
                    ? t('HOME_CONTINUE_RESUME_HINT')
                    : t('HOME_CONTINUE_RECOMMEND_HINT')}
                </AppText>
              </View>
            </View>

            <View className="mt-4 gap-1">
              <AppText
                raw
                weight="semibold"
                className="text-on-flow"
                style={{fontSize: 16}}
                numberOfLines={1}>
                {continueLesson.title}
                <AppText raw className="text-on-flow/80">
                  {`  ·  ${t('HOME_LESSON_MINUTES', {
                    count: continueLesson.estimatedMinutes,
                  })}`}
                </AppText>
              </AppText>
              {continueLesson.seriesName ? (
                <AppText raw variant="labelSmall" className="text-on-flow/80">
                  {continueLesson.seriesIndex && continueLesson.seriesTotal
                    ? t('HOME_LESSON_SERIES_PROGRESS', {
                        series: continueLesson.seriesName,
                        index: continueLesson.seriesIndex,
                        total: continueLesson.seriesTotal,
                      })
                    : continueLesson.seriesName}
                </AppText>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* Discover entry (recommended for you) — expandable list lands with #3 */}
      {home.recommendedLesson ? (
        <View className="mx-6 mt-8">
          <AppText raw variant="label" weight="semibold" className="mb-3">
            {t('HOME_DISCOVER_TITLE')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('HOME_DISCOVER_TITLE')}
            onPress={() =>
              home.recommendedLesson &&
              onOpenRecommended?.(home.recommendedLesson)
            }
            className="flex-row items-center justify-between p-4 rounded-2xl bg-surface border border-hair active:opacity-80">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-bg2">
                <Icon name="Sparkles" className="text-flow w-5 h-5" />
              </View>
              <View className="flex-1">
                <AppText raw variant="label" weight="medium" numberOfLines={1}>
                  {home.recommendedLesson.title}
                </AppText>
                <AppText raw variant="labelSmall" color="muted">
                  {t('HOME_LESSON_MINUTES', {
                    count: home.recommendedLesson.estimatedMinutes,
                  })}
                </AppText>
              </View>
            </View>
            <Icon name="ChevronRight" className="text-neutrals300 w-5 h-5" />
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

HomeView.displayName = 'HomeView';
