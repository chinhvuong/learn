import React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
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
  /** Open the recommended Lesson from a Discover suggestion card. */
  onOpenRecommended?: (lesson: HomeLessonRef) => void;
  /** Open the learner's My Library screen (the "Thư viện của tôi" row). */
  onOpenLibrary?: () => void;
  /** Open the Settings screen (the gear in the header). */
  onOpenSettings?: () => void;
}

/** A Discover suggestion card on Home (striped thumbnail + duration + title). */
interface SuggestionCard {
  title: string;
  minutes: number;
}

/**
 * Home (Học) — the habit-centric root screen on every launch (screens.md §8,
 * design node `RW9TL`; PRD stories 12–15). Its biggest action is **Continue**:
 * one tap re-enters the learning flow, resuming an in-progress Lesson if one
 * exists and only recommending a new one when nothing is in progress.
 *
 * It surfaces, top to bottom: the **Streak** + the two **Levels** (Reading and
 * Listening) as CEFR; the cumulative **North Star** (largest element); today's
 * **Daily Goal**; the **Continue** card; a Discover suggestion strip; and the
 * Series / My Library entries. All live values come from the persisted `home`
 * slice.
 *
 * Colors come from the theme tokens: teal (--flow) for actions/progress, amber
 * (--warm) for the North Star and Streak (Absorbed family) — no per-screen
 * hardcoded colors.
 */
export default function HomeView({
  onContinue,
  onOpenRecommended,
  onOpenLibrary,
  onOpenSettings,
}: HomeViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const home = useAppSelector(state => state.home);

  const continueLesson = selectContinueLesson(home);
  const isResuming = selectIsResuming(home);
  const dailyGoalPercent = selectDailyGoalPercent(home);

  const readingBand = scoreToCefr(home.readingLevel);
  const listeningBand = scoreToCefr(home.listeningLevel);

  // The 5-dot Daily Goal indicator: how many dots are "met" (teal vs hair).
  const goalDotsFilled = Math.round((dailyGoalPercent / 100) * 5);

  // North Star mini-chart — four amber bars rising left→right (design `Mini`).
  const chartBars = [14, 20, 27, 34];

  // Discover suggestions (recommended-for-you strip). Until the personalized
  // feed lands (#3) this seeds three cards mirroring the design wireframe; the
  // first opens the live recommendation when one exists.
  const suggestions: SuggestionCard[] = [
    {title: 'How memory works', minutes: 4},
    {title: 'A short history of tea', minutes: 6},
    {title: 'Why we dream', minutes: 3},
  ];

  return (
    <ScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 14,
        paddingBottom: insets.bottom + 18,
        paddingHorizontal: 16,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Top row: Streak · two Levels (CEFR) · Pro · Settings (design TopRow) */}
      <View className="flex-row items-center" style={{gap: 7}}>
        {/* Streak — amber (--warm), the Absorbed/Streak family */}
        <View className="flex-row items-center rounded-full bg-warm-soft px-2.5 py-1.5">
          <AppText
            raw
            weight="bold"
            className="text-warm-ink"
            style={{fontSize: 12.5}}
            accessibilityLabel={t('HOME_STREAK_A11Y', {count: home.streak})}>
            🔥 {String(home.streak)}
          </AppText>
        </View>

        {/* Two Levels, shown separately as CEFR (reading can outpace listening) */}
        <View className="rounded-full bg-surface-2 border border-border px-2.5 py-1.5">
          <AppText raw weight="semibold" className="text-ink-2" style={{fontSize: 11.5}}>
            {readingBand} {t('HOME_LEVEL_READING')}
          </AppText>
        </View>
        <View className="rounded-full bg-surface-2 border border-border px-2.5 py-1.5">
          <AppText raw weight="semibold" className="text-ink-2" style={{fontSize: 11.5}}>
            {listeningBand} {t('HOME_LEVEL_LISTENING')}
          </AppText>
        </View>

        <View className="flex-1" />

        {/* Pro — flow pill (paywall entry, story 60+) */}
        <View className="rounded-full bg-flow px-2.5 py-1.5">
          <AppText raw weight="bold" className="text-on-flow" style={{fontSize: 11.5}}>
            ✦ {t('HOME_PRO')}
          </AppText>
        </View>

        {/* Settings gear */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('HOME_SETTINGS')}
          onPress={onOpenSettings}
          hitSlop={8}
          className="w-8 h-8 rounded-[10px] items-center justify-center bg-surface-2 border border-border active:opacity-80">
          <Icon name="Settings" className="text-ink-2 w-[17px] h-[17px]" />
        </Pressable>
      </View>

      {/* North Star — the cumulative Absorbed count, the LARGEST element */}
      <View className="rounded-[20px] bg-warm-soft p-[18px]" style={{gap: 6}}>
        <AppText
          raw
          accessibilityRole="text"
          accessibilityLabel={t('HOME_NORTH_STAR_A11Y', {count: home.northStar})}
          className="text-warm-ink font-sans-extrabold"
          style={{fontSize: 54, lineHeight: 60, letterSpacing: -1.5}}>
          {home.northStar.toLocaleString('en-US')}
        </AppText>
        <AppText
          raw
          weight="medium"
          className="text-warm-ink"
          style={{fontSize: 13}}>
          {t('HOME_NORTH_STAR_CAPTION')}
        </AppText>
        <View className="flex-row items-end justify-between" style={{marginTop: 4}}>
          <View className="flex-row items-end" style={{gap: 5, height: 34}}>
            {chartBars.map((h, i) => (
              <View
                key={i}
                className="rounded-[3px] bg-warm"
                style={{width: 8, height: h}}
              />
            ))}
          </View>
          {home.absorbedToday > 0 ? (
            <AppText
              raw
              weight="bold"
              className="text-warm-ink"
              style={{fontSize: 12.5}}>
              {t('HOME_ABSORBED_TODAY', {count: home.absorbedToday})}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Daily Goal — today's progress toward the self-set goal (5-dot meter) */}
      <View
        className="flex-row items-center rounded-2xl bg-surface border border-hair p-3.5"
        style={{gap: 10}}>
        <AppText raw weight="semibold" className="text-ink" style={{fontSize: 13.5}}>
          {t('HOME_DAILY_GOAL')}
        </AppText>
        <View className="flex-row items-center" style={{gap: 6}}>
          {[0, 1, 2, 3, 4].map(i => (
            <View
              key={i}
              className={i < goalDotsFilled ? 'bg-flow' : 'bg-hair'}
              style={{width: 9, height: 9, borderRadius: 9}}
            />
          ))}
        </View>
        <View className="flex-1" />
        <AppText raw weight="bold" className="text-flow-ink" style={{fontSize: 14}}>
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

      {/* Continue — the BIGGEST action; resumes in-progress, else recommends */}
      {continueLesson ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('HOME_CONTINUE')}
          onPress={() => onContinue(continueLesson)}
          className="rounded-[18px] bg-flow p-[18px] active:opacity-90"
          style={{
            gap: 14,
            shadowColor: colors.flow,
            shadowOpacity: 0.34,
            shadowRadius: 18,
            shadowOffset: {width: 0, height: 10},
            elevation: 6,
          }}>
          <View className="flex-row items-center" style={{gap: 14}}>
            <View className="w-[52px] h-[52px] rounded-[14px] items-center justify-center bg-on-flow/15">
              <Icon name="Play" className="text-on-flow w-6 h-6" />
            </View>
            <View className="flex-1" style={{gap: 3}}>
              <AppText
                raw
                weight="bold"
                className="text-on-flow/80"
                style={{fontSize: 10.5, letterSpacing: 1.5}}>
                {(isResuming
                  ? t('HOME_CONTINUE')
                  : t('HOME_START_RECOMMENDED')
                ).toUpperCase()}
              </AppText>
              <AppText
                raw
                weight="extrabold"
                className="text-on-flow"
                style={{fontSize: 21}}
                numberOfLines={1}>
                {continueLesson.title}
              </AppText>
            </View>
          </View>

          <AppText
            raw
            weight="medium"
            className="text-on-flow/85"
            style={{fontSize: 12.5}}>
            {continueLesson.seriesName
              ? t('HOME_CONTINUE_META', {
                  series: continueLesson.seriesName,
                  minutes: continueLesson.estimatedMinutes,
                })
              : t('HOME_LESSON_MINUTES', {count: continueLesson.estimatedMinutes})}
          </AppText>

          {continueLesson.seriesIndex && continueLesson.seriesTotal ? (
            <View className="flex-row items-center" style={{gap: 10}}>
              <View className="flex-1 h-[7px] rounded-[4px] bg-on-flow/25 overflow-hidden">
                <View
                  className="h-full rounded-[4px] bg-on-flow"
                  style={{
                    width: `${Math.round(
                      (continueLesson.seriesIndex / continueLesson.seriesTotal) *
                        100,
                    )}%`,
                  }}
                />
              </View>
              <AppText raw weight="bold" className="text-on-flow" style={{fontSize: 12}}>
                {continueLesson.seriesIndex}/{continueLesson.seriesTotal}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* Discover suggestions (recommended for you) — strip of three cards */}
      <View className="flex-row items-center" style={{gap: 8}}>
        <View className="flex-row items-end" style={{gap: 7}}>
          <AppText raw weight="bold" className="text-ink" style={{fontSize: 16}}>
            {t('HOME_DISCOVER_TITLE')}
          </AppText>
          <AppText raw weight="medium" className="text-ink-3" style={{fontSize: 12.5}}>
            {t('HOME_DISCOVER_SUBTITLE')}
          </AppText>
        </View>
        <View className="flex-1" />
        <AppText raw weight="semibold" className="text-flow-ink" style={{fontSize: 12.5}}>
          {t('HOME_DISCOVER_SEE_ALL')}
        </AppText>
      </View>

      <View className="flex-row" style={{gap: 11}}>
        {suggestions.map((s, i) => (
          <Pressable
            key={s.title}
            accessibilityRole="button"
            accessibilityLabel={s.title}
            onPress={() =>
              i === 0 && home.recommendedLesson
                ? onOpenRecommended?.(home.recommendedLesson)
                : undefined
            }
            className="flex-1 rounded-2xl bg-surface border border-hair p-2 active:opacity-80"
            style={{gap: 8}}>
            <View className="h-[74px] rounded-[10px] bg-bg-2 items-end justify-end p-1.5 overflow-hidden">
              {/* Diagonal stripe texture (design `stripe` rects) */}
              {[6, 28, 50, 72, 94].map(left => (
                <View
                  key={left}
                  pointerEvents="none"
                  className="bg-border"
                  style={{
                    position: 'absolute',
                    left,
                    top: -6,
                    width: 7,
                    height: 96,
                    opacity: 0.5,
                    transform: [{rotate: '-25deg'}],
                  }}
                />
              ))}
              <View className="rounded-lg bg-ink/70 px-1.5 py-0.5">
                <AppText
                  raw
                  weight="bold"
                  className="text-on-flow"
                  style={{fontSize: 10.5}}>
                  {t('HOME_LESSON_MINUTES_SHORT', {count: s.minutes})}
                </AppText>
              </View>
            </View>
            <AppText
              raw
              weight="semibold"
              className="text-ink"
              style={{fontSize: 12.5, lineHeight: 16}}>
              {s.title}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Khám phá Series — entry into the Series browser (Discover/Guided) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('HOME_SERIES_TITLE')}
        className="flex-row items-center rounded-2xl bg-surface border border-hair p-3.5 active:opacity-80"
        style={{gap: 12}}>
        <View className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-flow-soft">
          <AppText raw className="text-flow-ink" style={{fontSize: 17}}>
            ★
          </AppText>
        </View>
        <View className="flex-1" style={{gap: 3}}>
          <AppText raw weight="bold" className="text-ink" style={{fontSize: 14.5}}>
            {t('HOME_SERIES_TITLE')}
          </AppText>
          <AppText raw weight="medium" className="text-ink-3" style={{fontSize: 12}}>
            {t('HOME_SERIES_SUBTITLE')}
          </AppText>
        </View>
        <Icon name="ChevronRight" className="text-ink-3 w-[18px] h-[18px]" />
      </Pressable>

      {/* Thư viện của tôi — entry into My Library (design node y5RJTT) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('HOME_LIBRARY_TITLE')}
        onPress={onOpenLibrary}
        className="flex-row items-center rounded-2xl bg-surface border border-hair p-3.5 active:opacity-80"
        style={{gap: 12}}>
        <View className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-flow-soft">
          <AppText raw className="text-flow-ink" style={{fontSize: 17}}>
            📚
          </AppText>
        </View>
        <View className="flex-1" style={{gap: 3}}>
          <AppText raw weight="bold" className="text-ink" style={{fontSize: 14.5}}>
            {t('HOME_LIBRARY_TITLE')}
          </AppText>
          <AppText raw weight="medium" className="text-ink-3" style={{fontSize: 12}}>
            {t('HOME_LIBRARY_SUBTITLE')}
          </AppText>
        </View>
        <Icon name="ChevronRight" className="text-ink-3 w-[18px] h-[18px]" />
      </Pressable>
    </ScrollView>
  );
}

HomeView.displayName = 'HomeView';
