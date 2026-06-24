import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon, ProgressBar} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Lesson} from '../types';
import {
  clampCoreIndex,
  coreIntroOrder,
  coreKindCounts,
  isFirstCore,
  isLastCore,
} from '../coreIntro';

export interface LessonCoreIntroPlayerProps {
  lesson: Lesson;
  /** Close / pause the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Finished the core preview → hand off to the reading surface. */
  onStartReading: () => void;
}

/**
 * Lesson Player — **core** step (screens.md §9–10b "Lõi chung"; design handoff
 * `#core` step 3). A flashcard-style introduction of each new Item one at a
 * time — Vocabulary / Chunk / Grammar Point — before the reading surface.
 *
 * The learner steps with prev / next and can jump straight to any Item via the
 * index dots. This is a *preview* only: it never marks Items Absorbed and never
 * touches the North Star (the absorption gesture lives on the reading surface).
 * Each card enters with the handoff's `floatPop` (pop + float-up).
 */
export default function LessonCoreIntroPlayer({
  lesson,
  onClose,
  onStartReading,
}: LessonCoreIntroPlayerProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const order = useMemo(() => coreIntroOrder(lesson.items), [lesson.items]);
  const counts = useMemo(() => coreKindCounts(lesson.items), [lesson.items]);
  const total = order.length;

  const [index, setIndex] = useState(0);
  const item = order[clampCoreIndex(index, total)];
  const first = isFirstCore(index);
  const last = isLastCore(index, total);

  // Card entry animation (handoff `floatPop`): pop + float, re-fired per card.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const cardStyle = {
    opacity: enter.interpolate({inputRange: [0, 0.4, 1], outputRange: [0, 1, 1]}),
    transform: [
      {translateY: enter.interpolate({inputRange: [0, 1], outputRange: [8, 0]})},
      {scale: enter.interpolate({inputRange: [0, 1], outputRange: [0.9, 1]})},
    ],
  };

  const goPrev = () => setIndex(i => clampCoreIndex(i - 1, total));
  const goNext = () => {
    if (last) {
      onStartReading();
    } else {
      setIndex(i => clampCoreIndex(i + 1, total));
    }
  };
  const jumpTo = (i: number) => setIndex(clampCoreIndex(i, total));

  if (!item) {
    return null;
  }

  const kindLabel =
    item.type === 'chunk'
      ? t('LP_CORE_KIND_CHUNK')
      : item.type === 'grammarPoint'
        ? t('LP_CORE_KIND_GRAMMAR')
        : t('LP_CORE_KIND_VOCAB');

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      {/* Header: close · "Lõi chung" · N/M. */}
      <View style={[styles.header, {borderBottomColor: colors.hair}]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('CLOSE')}
            onPress={onClose}
            hitSlop={8}
            style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="X" className="text-neutrals200 w-5 h-5" />
          </Pressable>
          <View style={styles.headerTitle}>
            <AppText raw style={[styles.headerTitleText, {color: colors.ink}]}>
              {t('LP_CORE_TITLE')}
            </AppText>
            <AppText raw style={[styles.headerSubtitle, {color: colors.ink3}]}>
              {t('LP_CORE_SUBTITLE')}
            </AppText>
          </View>
          <View style={[styles.counter, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={[styles.counterText, {color: colors.flowInk}]}>
              {t('LP_CORE_COUNT', {current: index + 1, total})}
            </AppText>
          </View>
        </View>

        <View style={styles.progressBar}>
          <ProgressBar value={total === 0 ? 0 : ((index + 1) / total) * 100} />
        </View>

        {/* Type segment header (📘 Từ / 🧩 Chunk / ⚙ NP). */}
        <View style={[styles.segments, {backgroundColor: colors.surface2}]}>
          <AppText
            raw
            style={[
              styles.segment,
              {
                color: item.type === 'vocabulary' ? colors.flowInk : colors.ink3,
              },
            ]}>
            {t('LP_CORE_SEG_VOCAB', {count: counts.vocabulary})}
          </AppText>
          <AppText
            raw
            style={[
              styles.segment,
              {color: item.type === 'chunk' ? colors.flowInk : colors.ink3},
            ]}>
            {t('LP_CORE_SEG_CHUNK', {count: counts.chunk})}
          </AppText>
          <AppText
            raw
            style={[
              styles.segment,
              {
                color:
                  item.type === 'grammarPoint' ? colors.flowInk : colors.ink3,
              },
            ]}>
            {t('LP_CORE_SEG_GRAMMAR', {count: counts.grammarPoint})}
          </AppText>
        </View>
      </View>

      {/* The flashcard. */}
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardScrollContent}>
        <Animated.View
          accessibilityLabel={item.headword}
          style={[
            styles.card,
            {backgroundColor: colors.surface, borderColor: colors.hair},
            cardStyle,
          ]}>
          <View style={[styles.kindPill, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={[styles.kindPillText, {color: colors.flowInk}]}>
              {kindLabel}
            </AppText>
          </View>

          <View style={styles.headwordRow}>
            <AppText raw style={[styles.headword, {color: colors.ink}]}>
              {item.headword}
            </AppText>
            <AppText raw style={[styles.pos, {color: colors.ink3}]}>
              {item.posLabel}
            </AppText>
          </View>

          {item.ipa ? (
            <AppText raw style={[styles.ipa, {color: colors.ink3}]}>
              {item.ipa}
            </AppText>
          ) : null}

          {/* Grammar Point → pattern box + authored VI explanation (ADR-0003). */}
          {item.type === 'grammarPoint' ? (
            <View>
              <View
                style={[
                  styles.patternBox,
                  {backgroundColor: colors.surface2, borderColor: colors.hair},
                ]}>
                <AppText raw style={[styles.patternLabel, {color: colors.ink3}]}>
                  {t('LP_GRAMMAR_PATTERN')}
                </AppText>
                <AppText raw style={[styles.patternText, {color: colors.ink}]}>
                  {item.pattern}
                </AppText>
              </View>
              {item.explanation ? (
                <AppText raw style={[styles.explain, {color: colors.ink2}]}>
                  <AppText raw style={{color: colors.ink}}>
                    {t('LP_GRAMMAR_EXPLAIN')}:{' '}
                  </AppText>
                  {item.explanation}
                </AppText>
              ) : null}
            </View>
          ) : (
            <AppText raw style={[styles.meaning, {color: colors.warmInk}]}>
              → {item.meaning}
            </AppText>
          )}

          {/* Chunk → usage pattern (ADR-0004). */}
          {item.type === 'chunk' && item.pattern ? (
            <AppText raw style={[styles.chunkPattern, {color: colors.ink2}]}>
              ⚙ {item.pattern}
            </AppText>
          ) : null}

          <View style={[styles.example, {borderTopColor: colors.hair}]}>
            <AppText raw style={[styles.exampleText, {color: colors.ink3}]}>
              {t('LP_IN_PASSAGE')}: “{item.example}”
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.listenBtn,
              {borderColor: colors.border, backgroundColor: colors.surface},
            ]}>
            <AppText raw style={[styles.listenText, {color: colors.ink}]}>
              🔊 {t('LP_LISTEN')}
            </AppText>
          </Pressable>
        </Animated.View>

        {/* Jump-to-index dots. */}
        <View
          accessibilityRole="tablist"
          style={styles.dots}>
          {order.map((dotItem, i) => (
            <Pressable
              key={dotItem.id}
              accessibilityRole="button"
              accessibilityLabel={t('LP_CORE_JUMP', {current: i + 1, total})}
              accessibilityState={{selected: i === index}}
              onPress={() => jumpTo(i)}
              hitSlop={6}
              style={[
                styles.dot,
                i === index
                  ? {backgroundColor: colors.flow, width: 22}
                  : {backgroundColor: colors.border},
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer: prev · next/"Bắt đầu đọc". */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 16 + insets.bottom,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LP_CORE_PREV')}
          accessibilityState={{disabled: first}}
          disabled={first}
          onPress={goPrev}
          style={[
            styles.prevBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: first ? 0.4 : 1,
            },
          ]}>
          <AppText raw style={[styles.prevText, {color: colors.ink2}]}>
            ‹
          </AppText>
        </Pressable>
        <View style={styles.nextWrap}>
          <AppButton
            variant="primary"
            onPress={goNext}
            accessibilityLabel={last ? t('LP_CORE_START_READING') : t('LP_CORE_NEXT')}>
            <AppText raw style={[styles.nextText, {color: colors.onFlow}]}>
              {last ? t('LP_CORE_START_READING') : t('LP_CORE_NEXT')}
            </AppText>
          </AppButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 1},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 11},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {flex: 1, minWidth: 0},
  headerTitleText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  headerSubtitle: {fontFamily: InflowFonts.ui.regular, fontSize: 10.5, marginTop: 1},
  counter: {borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5},
  counterText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  progressBar: {marginBottom: 11},
  segments: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
  },
  segment: {
    flex: 1,
    textAlign: 'center',
    fontFamily: InflowFonts.ui.semibold,
    fontSize: 10.5,
    paddingVertical: 4,
  },
  cardScroll: {flex: 1},
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 12},
    elevation: 12,
  },
  kindPill: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 14,
  },
  kindPillText: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headwordRow: {flexDirection: 'row', alignItems: 'baseline', gap: 9, flexWrap: 'wrap'},
  headword: {fontFamily: InflowFonts.reading.medium, fontSize: 30, letterSpacing: -0.4},
  pos: {fontFamily: InflowFonts.ui.bold, fontSize: 11},
  ipa: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 15,
    marginTop: 4,
  },
  meaning: {fontFamily: InflowFonts.ui.extrabold, fontSize: 21, marginTop: 14},
  chunkPattern: {fontFamily: InflowFonts.ui.regular, fontSize: 13, marginTop: 5},
  patternBox: {borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14},
  patternLabel: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  patternText: {fontFamily: InflowFonts.reading.medium, fontSize: 16},
  explain: {fontFamily: InflowFonts.ui.regular, fontSize: 13.5, marginTop: 11, lineHeight: 21},
  example: {marginTop: 16, paddingTop: 14, borderTopWidth: 1},
  exampleText: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 20,
  },
  listenBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 14,
  },
  listenText: {fontFamily: InflowFonts.ui.bold, fontSize: 13},
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
  },
  dot: {height: 7, width: 7, borderRadius: 4},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  prevBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: {fontFamily: InflowFonts.ui.regular, fontSize: 22, lineHeight: 24},
  nextWrap: {flex: 1},
  nextText: {fontFamily: InflowFonts.ui.bold, fontSize: 15.5},
});

LessonCoreIntroPlayer.displayName = 'LessonCoreIntroPlayer';
