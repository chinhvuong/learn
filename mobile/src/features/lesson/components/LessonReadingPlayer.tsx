import React, {useEffect, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon, ProgressBar} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  closeCard,
  completeSession,
  countDecided,
  isAllDecided,
  markRestKnown,
  selectNorthStarLive,
  startSession,
  tapItem,
  toggleAllSentenceTranslations,
  toggleSentenceTranslation,
} from '../lessonSessionSlice';
import type {Item, Lesson} from '../types';
import BilingualPassageView from './BilingualPassageView';
import ItemMeaningCard from './ItemMeaningCard';
import NorthStarCounter from './NorthStarCounter';

export interface LessonReadingPlayerProps {
  lesson: Lesson;
  /** Items Absorbed in a prior Lesson, rendered pre-highlighted inline. */
  preAbsorbedItems?: Record<string, Item>;
  /** Cumulative North Star before this Lesson (Absorbed-this-session adds on). */
  northStarBase: number;
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Called when the learner completes the Lesson (all Items processed). */
  onCompleted: () => void;
}

/**
 * Lesson Player — Reading surface (screens.md §9). The learner reads the
 * Target-primary Bilingual Passage, taps Items to absorb them (the absorption
 * gesture: reveal meaning + mark Absorbed + North Star +1), reveals sentence
 * translations on demand, and completes once every projected Item is decided
 * (untapped Items become Known).
 */
export default function LessonReadingPlayer({
  lesson,
  preAbsorbedItems = {},
  northStarBase,
  onClose,
  onCompleted,
}: LessonReadingPlayerProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.lessonSession);

  // All Items addressable in the passage: projected + pre-Absorbed review Items.
  const itemsById = useMemo(() => {
    const map: Record<string, Item> = {};
    lesson.items.forEach(item => {
      map[item.id] = item;
    });
    return {...preAbsorbedItems, ...map};
  }, [lesson.items, preAbsorbedItems]);

  const sentenceIds = useMemo(
    () => lesson.passage.sentences.map(s => s.id),
    [lesson.passage.sentences],
  );

  // Start a fresh session whenever the Lesson changes.
  useEffect(() => {
    dispatch(
      startSession({
        lessonId: lesson.id,
        projectedItemIds: lesson.items.map(item => item.id),
        northStarBase,
      }),
    );
  }, [dispatch, lesson.id, lesson.items, northStarBase]);

  // Guard: the session may not yet point at this Lesson on the first render
  // after a Lesson change (the startSession effect runs post-render).
  const sessionReady = session.lessonId === lesson.id;

  const decidedCount = sessionReady ? countDecided(session) : 0;
  const total = lesson.items.length;
  const allDecided = sessionReady && isAllDecided(session);
  const remaining = total - decidedCount;
  const northStarLive = sessionReady
    ? selectNorthStarLive(session)
    : northStarBase;
  const openItem = session.openCardItemId
    ? itemsById[session.openCardItemId]
    : null;

  const handleComplete = () => {
    dispatch(completeSession());
    onCompleted();
  };

  return (
    <View
      style={[styles.root, {backgroundColor: colors.appBg, paddingTop: insets.top}]}>
      {/* Header chrome: close · title + meta · North Star pill. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
          <Icon name="X" className="text-neutrals200 w-4 h-4" />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText raw style={[styles.titleText, {color: colors.ink}]} numberOfLines={1}>
            {lesson.title}
          </AppText>
          <AppText raw style={[styles.titleMeta, {color: colors.ink3}]} numberOfLines={1}>
            {t('LP_READING_META', {
              topic: lesson.topic,
              cefr: lesson.cefr,
              mode: t('LP_READING_MODE'),
            })}
          </AppText>
        </View>
        <NorthStarCounter
          value={northStarLive}
          floatKey={session.absorbFloatKey}
          variant="pill"
        />
      </View>

      {/* Progress: đã quyết N/M. */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <ProgressBar value={total === 0 ? 0 : (decidedCount / total) * 100} />
        </View>
        <AppText raw style={[styles.progressText, {color: colors.ink3}]}>
          {t('LP_DECIDED_PROGRESS', {decided: decidedCount, total})}
        </AppText>
      </View>

      {/* Translate-all affordance. */}
      <View style={styles.translateAllRow}>
        <View style={[styles.viHint, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.viHintText, {color: colors.flowInk}]}>
            VI
          </AppText>
        </View>
        <AppText raw style={[styles.translateHint, {color: colors.ink3}]} numberOfLines={2}>
          {t('LP_TRANSLATE_HINT')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            dispatch(toggleAllSentenceTranslations({sentenceIds}))
          }>
          <AppText raw style={[styles.translateAll, {color: colors.ink2}]}>
            {t('LP_TRANSLATE_ALL')}
          </AppText>
        </Pressable>
      </View>

      {/* The Bilingual Passage. */}
      <ScrollView
        style={styles.passageScroll}
        contentContainerStyle={styles.passageContent}>
        <BilingualPassageView
          sentences={lesson.passage.sentences}
          itemsById={itemsById}
          decided={session.decided}
          preAbsorbedItemIds={Object.keys(preAbsorbedItems)}
          revealedSentences={session.revealedSentences}
          onTapItem={id => dispatch(tapItem({itemId: id}))}
          onToggleSentence={id =>
            dispatch(toggleSentenceTranslation({sentenceId: id}))
          }
        />
      </ScrollView>

      {/* Open Item meaning card overlay (the absorption gesture's reveal). */}
      {openItem ? (
        <View
          style={[styles.cardOverlay, {bottom: 94 + insets.bottom}]}
          pointerEvents="box-none">
          <ItemMeaningCard
            item={openItem}
            onClose={() => dispatch(closeCard())}
          />
        </View>
      ) : null}

      {/* Footer: "Biết hết phần còn lại" + Complete. */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 14 + insets.bottom,
          },
        ]}>
        {remaining > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => dispatch(markRestKnown())}
            style={styles.knowRest}>
            <AppText raw style={[styles.knowRestText, {color: colors.ink3}]}>
              {t('LP_KNOW_REST')}
            </AppText>
          </Pressable>
        ) : null}
        <AppButton
          variant="primary"
          disabled={!allDecided}
          onPress={handleComplete}
          accessibilityLabel={t('LP_TO_QUIZ')}>
          <AppText
            raw
            style={[styles.completeText, {color: colors.onFlow}]}>
            {t('LP_TO_QUIZ')}
          </AppText>
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {flex: 1, minWidth: 0},
  titleText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  titleMeta: {fontFamily: InflowFonts.ui.regular, fontSize: 10.5, marginTop: 1},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
    marginTop: 2,
    marginBottom: 4,
  },
  progressBar: {flex: 1},
  progressText: {fontFamily: InflowFonts.ui.bold, fontSize: 10.5},
  translateAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  viHint: {
    minWidth: 16,
    height: 15,
    paddingHorizontal: 3.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viHintText: {fontFamily: InflowFonts.ui.bold, fontSize: 8, letterSpacing: 0.3},
  translateHint: {flex: 1, fontFamily: InflowFonts.ui.regular, fontSize: 11.5, lineHeight: 16},
  translateAll: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 11.5,
    textDecorationLine: 'underline',
  },
  passageScroll: {flex: 1},
  passageContent: {paddingHorizontal: 22, paddingTop: 6, paddingBottom: 40},
  cardOverlay: {position: 'absolute', left: 14, right: 14},
  footer: {
    paddingHorizontal: 22,
    paddingTop: 13,
    borderTopWidth: 1,
  },
  knowRest: {alignItems: 'center', marginBottom: 11},
  knowRestText: {fontFamily: InflowFonts.ui.semibold, fontSize: 12.5},
  completeText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonReadingPlayer.displayName = 'LessonReadingPlayer';
