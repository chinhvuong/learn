import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {cn} from '@/utils';
import {RootStackScreenProps} from '@/navigation/types';
import {
  CreatedLesson,
  FollowedSeries,
  InProgressLesson,
  LIBRARY_DATA,
  LIBRARY_FILTERS,
  LibraryFilter,
} from '@/features/library/libraryData';

type Nav = RootStackScreenProps<'MyLibrary'>['navigation'];

/**
 * Thư viện của tôi (My Library) — the learner's own Lessons, grouped (screens.md
 * §08b; design node `y5RJTT`). Reached from the Home "Thư viện của tôi" row.
 *
 * Lists, in order: in-progress Lessons (**Đang học**, each resumable into the
 * Lesson Player), followed **Series**, learner-created Lessons (**Bạn đã tạo**),
 * and the completed history (**Đã hoàn thành**). A chip row filters the surface;
 * "Tất cả" shows everything. All chrome is Vietnamese; English titles are Lesson
 * content and stay verbatim. Colors come from the theme tokens — teal (--flow)
 * for actions/progress, amber (--warm) for the completed (Absorbed) family.
 */
export default function MyLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();

  const [filter, setFilter] = useState<LibraryFilter>('all');

  const {inProgress, series, created, completed, completedTotal} = LIBRARY_DATA;

  const show = useMemo(
    () => ({
      learning: filter === 'all' || filter === 'learning',
      series: filter === 'all' || filter === 'learning',
      created: filter === 'all' || filter === 'created',
      done: filter === 'all' || filter === 'done',
    }),
    [filter],
  );

  const openLesson = (lessonId: string) =>
    navigation.navigate('LessonPlayer', {lessonId});

  return (
    <View className="flex-1 bg-app-bg">
      {/* Header — back · title · search (design Header) */}
      <View
        className="flex-row items-center border-b border-hair px-4 pb-3"
        style={{paddingTop: insets.top + 12, gap: 10}}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LIBRARY_BACK')}
          onPress={() => navigation.goBack()}
          className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-surface-2 border border-border active:opacity-80">
          <Icon name="ArrowLeft" className="text-ink w-[18px] h-[18px]" />
        </Pressable>
        <AppText raw weight="extrabold" className="flex-1 text-ink" style={{fontSize: 19}}>
          {t('LIBRARY_TITLE')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LIBRARY_SEARCH')}
          className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-surface-2 border border-border active:opacity-80">
          <Icon name="Search" className="text-ink-2 w-[16px] h-[16px]" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: insets.bottom + 18,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Filter chips (design Filters) */}
        <View className="flex-row" style={{gap: 8}}>
          {LIBRARY_FILTERS.map(({key, labelKey}) => {
            const active = key === filter;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                onPress={() => setFilter(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 active:opacity-80',
                  active ? 'bg-flow border-flow' : 'bg-surface border-border',
                )}>
                <AppText
                  raw
                  weight={active ? 'bold' : 'semibold'}
                  className={active ? 'text-on-flow' : 'text-ink-2'}
                  style={{fontSize: 12.5}}>
                  {t(labelKey)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Đang học — in-progress Lessons */}
        {show.learning ? (
          <View style={{gap: 10}}>
            <SectionHeader
              title={t('LIBRARY_SECTION_LEARNING')}
              count={inProgress.length}
            />
            {inProgress.map(lesson => (
              <InProgressRow
                key={lesson.lessonId}
                lesson={lesson}
                onPress={() => openLesson(lesson.lessonId)}
              />
            ))}
          </View>
        ) : null}

        {/* Series đang theo — followed Series */}
        {show.series ? (
          <View style={{gap: 10}}>
            <SectionHeader
              title={t('LIBRARY_SECTION_SERIES')}
              count={series.length}
              trailing={
                <AppText
                  raw
                  weight="semibold"
                  className="text-flow-ink"
                  style={{fontSize: 12}}>
                  {t('LIBRARY_DISCOVER')}
                </AppText>
              }
            />
            {series.map(s => (
              <SeriesRow key={s.id} series={s} />
            ))}
          </View>
        ) : null}

        {/* Bạn đã tạo — learner-created Lessons */}
        {show.created ? (
          <View style={{gap: 10}}>
            <SectionHeader
              title={t('LIBRARY_SECTION_CREATED')}
              count={created.length}
              trailing={
                <AppText
                  raw
                  weight="semibold"
                  className="text-ink-3"
                  style={{fontSize: 12}}>
                  {t('LIBRARY_CREATED_SOURCES')}
                </AppText>
              }
            />
            {created.map(c => (
              <CreatedRow
                key={c.id}
                lesson={c}
                onPress={() => openLesson(c.id)}
              />
            ))}
          </View>
        ) : null}

        {/* Đã hoàn thành — completed history */}
        {show.done ? (
          <View style={{gap: 8}}>
            <SectionHeader
              title={t('LIBRARY_SECTION_DONE')}
              count={completedTotal}
            />
            <View>
              {completed.map(c => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={c.title}
                  onPress={() => openLesson(c.id)}
                  className="flex-row items-center px-0.5 py-2.5 active:opacity-80"
                  style={{gap: 12}}>
                  <View className="w-7 h-7 rounded-full items-center justify-center bg-warm-soft">
                    <AppText raw weight="extrabold" className="text-warm-ink" style={{fontSize: 13}}>
                      ✓
                    </AppText>
                  </View>
                  <AppText
                    raw
                    weight="semibold"
                    className="flex-1 text-ink"
                    style={{fontSize: 14}}
                    numberOfLines={1}>
                    {c.title}
                  </AppText>
                  <AppText raw weight="medium" className="text-ink-3" style={{fontSize: 11.5}}>
                    {t(c.whenKey)}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              className="rounded-[14px] bg-surface border border-border items-center justify-center py-3.5 active:opacity-80">
              <AppText raw weight="bold" className="text-flow-ink" style={{fontSize: 13}}>
                {t('LIBRARY_SEE_ALL_DONE', {count: completedTotal})}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

MyLibraryScreen.displayName = 'MyLibraryScreen';

/** A section header — title + a count pill + optional trailing affordance. */
function SectionHeader({
  title,
  count,
  trailing,
}: {
  title: string;
  count: number;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center" style={{gap: 8}}>
      <View className="flex-row items-center" style={{gap: 8}}>
        <AppText raw weight="bold" className="text-ink" style={{fontSize: 15.5}}>
          {title}
        </AppText>
        <View className="rounded-[9px] bg-surface-2 px-1.5 py-0.5">
          <AppText raw weight="bold" className="text-ink-3" style={{fontSize: 11.5}}>
            {String(count)}
          </AppText>
        </View>
      </View>
      <View className="flex-1" />
      {trailing}
    </View>
  );
}

/** An in-progress Lesson card with a leading tile, meta, progress bar + Play. */
function InProgressRow({
  lesson,
  onPress,
}: {
  lesson: InProgressLesson;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lesson.title}
      onPress={onPress}
      className="flex-row items-center rounded-2xl bg-surface border border-hair p-3 active:opacity-80"
      style={{gap: 12}}>
      <View className="w-[50px] h-[50px] rounded-xl items-center justify-center bg-surface-2">
        <AppText raw style={{fontSize: 22}}>
          {lesson.emoji}
        </AppText>
      </View>
      <View className="flex-1" style={{gap: 6}}>
        <AppText
          raw
          weight="bold"
          className="text-ink"
          style={{fontSize: 14.5}}
          numberOfLines={1}>
          {lesson.title}
        </AppText>
        <AppText raw weight="medium" className="text-ink-3" style={{fontSize: 12}}>
          {lesson.subtitle}
        </AppText>
        <View className="flex-row items-center" style={{gap: 9}}>
          <View className="flex-1 h-1.5 rounded-[3px] bg-hair overflow-hidden">
            <View
              className="h-full rounded-[3px] bg-flow"
              style={{width: `${Math.round(lesson.progress * 100)}%`}}
            />
          </View>
          <AppText raw weight="semibold" className="text-ink-3" style={{fontSize: 11.5}}>
            {lesson.progressLabel}
          </AppText>
        </View>
      </View>
      <View className="w-[38px] h-[38px] rounded-full items-center justify-center bg-flow">
        <Icon name="Play" className="text-on-flow w-[17px] h-[17px]" />
      </View>
    </Pressable>
  );
}

/** A followed-Series card — icon, title, and a thin progress bar. */
function SeriesRow({series}: {series: FollowedSeries}) {
  const pct = series.total > 0 ? Math.round((series.done / series.total) * 100) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={series.title}
      className="flex-row items-center rounded-2xl bg-surface border border-hair p-3 active:opacity-80"
      style={{gap: 12}}>
      <View className="w-10 h-10 rounded-xl items-center justify-center bg-flow-soft">
        <AppText raw className="text-flow-ink" style={{fontSize: 19}}>
          {series.emoji}
        </AppText>
      </View>
      <View className="flex-1" style={{gap: 7}}>
        <AppText
          raw
          weight="bold"
          className="text-ink"
          style={{fontSize: 14}}
          numberOfLines={1}>
          {series.title}
        </AppText>
        <View className="h-1.5 rounded-[3px] bg-hair overflow-hidden">
          <View
            className="h-full rounded-[3px] bg-flow"
            style={{width: `${pct}%`}}
          />
        </View>
      </View>
    </Pressable>
  );
}

/** Map a created Source's kind to its leading-tile glyph (design `Src`). */
function createdGlyph(lesson: CreatedLesson): {text: string; danger?: boolean} {
  switch (lesson.kind) {
    case 'file':
      return {text: 'PDF', danger: true};
    case 'text':
      return {text: '📝'};
    case 'link':
    case 'article':
    default:
      return {text: '🔗'};
  }
}

/** A learner-created Lesson row — Source tile, meta, and a status badge. */
function CreatedRow({
  lesson,
  onPress,
}: {
  lesson: CreatedLesson;
  onPress: () => void;
}) {
  const {t} = useTranslation();
  const glyph = createdGlyph(lesson);
  const badge = lesson.badge;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lesson.title}
      onPress={onPress}
      className="flex-row items-center rounded-2xl bg-surface border border-hair p-3 active:opacity-80"
      style={{gap: 12}}>
      <View className="w-11 h-11 rounded-xl items-center justify-center bg-surface-2">
        <AppText
          raw
          weight={glyph.danger ? 'extrabold' : 'regular'}
          className={glyph.danger ? 'text-error' : 'text-ink'}
          style={{fontSize: glyph.danger ? 11 : 18}}>
          {glyph.text}
        </AppText>
      </View>
      <View className="flex-1" style={{gap: 3}}>
        <AppText
          raw
          weight="bold"
          className="text-ink"
          style={{fontSize: 14}}
          numberOfLines={1}>
          {lesson.title}
        </AppText>
        <AppText
          raw
          weight="medium"
          className="text-ink-3"
          style={{fontSize: 11.5}}
          numberOfLines={1}>
          {lesson.subtitle}
        </AppText>
      </View>
      {badge.kind === 'done' ? (
        <View className="rounded-[9px] bg-warm-soft px-2.5 py-1">
          <AppText raw weight="bold" className="text-warm-ink" style={{fontSize: 11}}>
            {t('LIBRARY_BADGE_DONE')}
          </AppText>
        </View>
      ) : badge.kind === 'progress' ? (
        <View className="rounded-[9px] bg-flow-soft px-2.5 py-1">
          <AppText raw weight="bold" className="text-flow-ink" style={{fontSize: 11}}>
            {badge.percent}%
          </AppText>
        </View>
      ) : (
        <View className="rounded-[9px] bg-surface-2 px-2.5 py-1">
          <AppText raw weight="bold" className="text-ink-3" style={{fontSize: 11}}>
            {t('LIBRARY_BADGE_NEW')}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
