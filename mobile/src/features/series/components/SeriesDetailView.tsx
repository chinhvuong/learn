import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Play} from 'lucide-react-native';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {currentLessonIndex, type Series, type SeriesLesson} from '../seriesData';

export interface SeriesDetailViewProps {
  series: Series;
  /** Back to Series Browse. */
  onBack: () => void;
  /** Open a Lesson (the primary CTA, or a non-locked row). */
  onOpenLesson: (lesson: SeriesLesson) => void;
}

/** Diagonal "streak" stripes behind the teal banner. */
function BannerStripes({color}: {color: string}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[-40, 4, 48, 92, 136, 180, 224, 268, 312, 356].map((x, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: -30,
            width: 16,
            height: 200,
            opacity: 0.45,
            backgroundColor: color,
            transform: [{rotate: '-22deg'}],
          }}
        />
      ))}
    </View>
  );
}

/**
 * 17b Series — Detail (`e4eYZ`; screens.md §05). A single curated **Series**: a
 * teal banner with the topic emoji + back, the title + meta ("12 bài · ~50 phút
 * · B1"), a progress bar toward completion, the "Tiếp tục bài N →" CTA, then the
 * ordered Lesson list — each Lesson done (✓ amber), current (▶ teal, popped),
 * open (hollow circle), or locked (🔒, dimmed "ngoài Starter").
 *
 * Tokens only — teal `--flow` for progress / current Lesson / CTA, amber
 * `--warm` for completed Lessons.
 */
export default function SeriesDetailView({series, onBack, onOpenLesson}: SeriesDetailViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const lessons = series.lessons ?? [];
  const continueIndex = currentLessonIndex(series);
  const progressPct = series.total > 0 ? (series.done / series.total) * 100 : 0;

  const renderLesson = (lesson: SeriesLesson) => {
    const locked = lesson.status === 'locked';
    const current = lesson.status === 'current';
    const done = lesson.status === 'done';

    // Leading circle: amber-soft ✓ (done), teal ▶ (current), hollow (open),
    // surface-2 🔒 (locked).
    let circle: React.ReactNode;
    if (done) {
      circle = (
        <View style={[styles.circle, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.circleCheck, {color: colors.warmInk}]}>
            ✓
          </AppText>
        </View>
      );
    } else if (current) {
      circle = (
        <View style={[styles.circle, {backgroundColor: colors.flow}]}>
          <Play size={13} color={colors.onFlow} fill={colors.onFlow} strokeWidth={0} />
        </View>
      );
    } else if (locked) {
      circle = (
        <View style={[styles.circle, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.circleLock, {color: colors.ink3}]}>
            🔒
          </AppText>
        </View>
      );
    } else {
      circle = (
        <View style={[styles.circle, styles.circleHollow, {backgroundColor: colors.surface, borderColor: colors.border}]} />
      );
    }

    return (
      <Pressable
        key={lesson.lessonId}
        accessibilityRole="button"
        accessibilityLabel={lesson.title}
        disabled={locked}
        onPress={() => !locked && onOpenLesson(lesson)}
        style={[
          styles.lessonRow,
          current
            ? {backgroundColor: colors.flowSoft, borderColor: colors.flow, borderWidth: 1.5}
            : {backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1},
          locked && {opacity: 0.6},
        ]}>
        {circle}
        <View style={styles.lessonCol}>
          <AppText
            raw
            weight={current ? 'bold' : 'semibold'}
            style={[styles.lessonTitle, {color: current ? colors.flowInk : locked ? colors.ink2 : colors.ink}]}>
            {lesson.title}
          </AppText>
          {locked && (
            <AppText raw style={[styles.lessonSub, {color: colors.ink3}]}>
              {t('SERIES_LESSON_OUTSIDE_STARTER')}
            </AppText>
          )}
        </View>
        {!locked && (
          <AppText raw style={[styles.lessonDur, {color: current ? colors.flowInk : colors.ink3}]}>
            {t('SERIES_LESSON_DURATION', {count: lesson.minutes})}
          </AppText>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.appBg}}>
      <ScrollView
        style={{backgroundColor: colors.appBg}}
        contentContainerStyle={{paddingBottom: 24}}
        showsVerticalScrollIndicator={false}>
        {/* Teal banner with stripes, back chip, topic emoji */}
        <View style={[styles.banner, {backgroundColor: colors.flow, paddingTop: insets.top}]}>
          <BannerStripes color={colors.flowPress} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('SERIES_BACK')}
            hitSlop={8}
            onPress={onBack}
            style={[styles.back, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
            <AppText raw style={[styles.backArrow, {color: colors.onFlow}]}>
              ←
            </AppText>
          </Pressable>
          <AppText raw style={[styles.bannerEmoji, {color: colors.onFlow}]}>
            {series.emoji}
          </AppText>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <AppText raw style={[styles.detailTitle, {color: colors.ink}]}>
            {series.topic}
          </AppText>
          <AppText raw style={[styles.detailMeta, {color: colors.ink2}]}>
            {t('SERIES_DETAIL_META', {lessons: series.total, minutes: series.minutes, band: series.band})}
          </AppText>

          {/* Progress bar + fraction */}
          <View style={styles.progressRow}>
            <View style={[styles.track, {backgroundColor: colors.surface2}]}>
              <View
                style={[styles.fill, {backgroundColor: colors.flow, width: `${progressPct}%`}]}
              />
            </View>
            <AppText raw style={[styles.frac, {color: colors.ink3}]}>
              {t('SERIES_DETAIL_PROGRESS_FRAC', {done: series.done, total: series.total})}
            </AppText>
          </View>

          {/* Primary CTA */}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const target =
                lessons.find(l => l.status === 'current') ?? lessons.find(l => l.status !== 'done' && l.status !== 'locked');
              if (target) {
                onOpenLesson(target);
              }
            }}
            style={[styles.primary, {backgroundColor: colors.flow}]}>
            <AppText raw style={[styles.primaryText, {color: colors.onFlow}]}>
              {continueIndex
                ? t('SERIES_DETAIL_CONTINUE', {index: continueIndex})
                : t('SERIES_DETAIL_START')}
            </AppText>
          </Pressable>

          {/* Lesson list */}
          <View style={styles.lessons}>{lessons.map(renderLesson)}</View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {height: 128, overflow: 'hidden', justifyContent: 'flex-start'},
  back: {position: 'absolute', left: 14, top: 16, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12},
  backArrow: {fontFamily: InflowFonts.ui.bold, fontSize: 18},
  bannerEmoji: {position: 'absolute', right: 24, bottom: 14, fontSize: 46},
  body: {paddingVertical: 18, paddingHorizontal: 16, gap: 14},
  detailTitle: {fontFamily: InflowFonts.ui.extrabold, fontSize: 23, letterSpacing: -0.6},
  detailMeta: {fontFamily: InflowFonts.ui.regular, fontSize: 13, marginTop: -8},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  track: {flex: 1, height: 8, borderRadius: 999, overflow: 'hidden'},
  fill: {height: '100%', borderRadius: 999},
  frac: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
  primary: {borderRadius: 16, paddingVertical: 16, alignItems: 'center'},
  primaryText: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  lessons: {gap: 8},
  lessonRow: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14},
  circle: {width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center'},
  circleHollow: {borderWidth: 1.5},
  circleCheck: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  circleLock: {fontSize: 12},
  lessonCol: {flex: 1, gap: 1},
  lessonTitle: {fontFamily: InflowFonts.ui.semibold, fontSize: 14},
  lessonSub: {fontFamily: InflowFonts.ui.regular, fontSize: 11},
  lessonDur: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
});

SeriesDetailView.displayName = 'SeriesDetailView';
