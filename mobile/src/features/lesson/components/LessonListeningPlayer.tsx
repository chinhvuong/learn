import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon, Switch} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  closeCard,
  completeSession,
  countDecided,
  isAllDecided,
  selectNorthStarLive,
  startSession,
  tapItem,
  toggleSentenceTranslation,
} from '../lessonSessionSlice';
import type {Item, Lesson} from '../types';
import {
  useListeningReplayAudio,
  type LessonAudioClock,
} from '../useListeningReplayAudio';
import ItemMeaningCard from './ItemMeaningCard';
import NorthStarCounter from './NorthStarCounter';

export interface LessonListeningPlayerProps {
  /** An audio Lesson — `lesson.audio` MUST be present (Listening Replay). */
  lesson: Lesson;
  /** Cumulative North Star before this Lesson (Absorbed-this-session adds on). */
  northStarBase: number;
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Called when the learner completes the Lesson (all Items processed). */
  onCompleted: () => void;
  /**
   * Test/seam hook: supply a custom audio clock factory (e.g. a real audio
   * backend, or a deterministic fake). Defaults to the mock JS clock.
   */
  makeClock?: (durationSec: number) => LessonAudioClock;
}

/**
 * Lesson Player — Listening Replay surface (screens.md §10), the Practice Mode
 * layered on the common core for audio Sources (ADR-0002).
 *
 * The transcript is **hidden by default** — the learner hears each sentence
 * first (real listening, not reading-along). Controls: play/pause, slow mode
 * ("🐢 chậm"), reveal-transcript ("Hiện lời"), prev/next sentence, and replay an
 * individual Item's audio span via the shared-layer timestamps. Once revealed,
 * the transcript carries the *same* tappable-Item absorption flow as Reading
 * (tap = reveal meaning + mark Absorbed + North Star +1) and a per-sentence
 * translation toggle. An optional **karaoke (read-along)** toggle keeps the
 * text visible as a gentler on-ramp for beginners.
 *
 * This component does not alter Reading behavior; it reuses the same session
 * reducer for the absorption gesture and is selected by Source type (presence
 * of `lesson.audio`).
 */
export default function LessonListeningPlayer({
  lesson,
  northStarBase,
  onClose,
  onCompleted,
  makeClock,
}: LessonListeningPlayerProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.lessonSession);

  const audio = lesson.audio!;
  const sentences = lesson.passage.sentences;

  // Local Listening Replay UI state (kept out of the shared reducer so it never
  // touches Reading): transcript reveal + karaoke (read-along).
  const [textRevealed, setTextRevealed] = useState(false);
  const [karaoke, setKaraoke] = useState(false);
  const showText = textRevealed || karaoke;

  const audioState = useListeningReplayAudio(audio, makeClock);

  const itemsById = useMemo(() => {
    const map: Record<string, Item> = {};
    lesson.items.forEach(item => {
      map[item.id] = item;
    });
    return map;
  }, [lesson.items]);

  // Start a fresh session whenever the Lesson changes (same contract as Reading).
  useEffect(() => {
    dispatch(
      startSession({
        lessonId: lesson.id,
        projectedItemIds: lesson.items.map(item => item.id),
        northStarBase,
      }),
    );
  }, [dispatch, lesson.id, lesson.items, northStarBase]);

  const sessionReady = session.lessonId === lesson.id;
  const decidedCount = sessionReady ? countDecided(session) : 0;
  const total = lesson.items.length;
  const allDecided = sessionReady && isAllDecided(session);
  const northStarLive = sessionReady
    ? selectNorthStarLive(session)
    : northStarBase;
  const openItem = session.openCardItemId
    ? itemsById[session.openCardItemId]
    : null;

  const currentIndex = audioState.currentSentenceIndex;
  const currentSentence = sentences[currentIndex];

  const handleComplete = () => {
    dispatch(completeSession());
    onCompleted();
  };

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      {/* Header chrome: close · Source label · North Star. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={styles.closeBtn}>
          <Icon name="X" className="text-foreground w-6 h-6" />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText raw variant="heading5" weight="bold" numberOfLines={1}>
            {audio.sourceLabel}
          </AppText>
        </View>
        <View style={styles.northStarWrap}>
          <NorthStarCounter
            value={northStarLive}
            floatKey={session.absorbFloatKey}
          />
          <AppText raw style={[styles.northStarLabel, {color: colors.warmInk}]}>
            {t('LP_NORTH_STAR_LABEL')}
          </AppText>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}>
        {/* The "now playing" orb + sentence position. */}
        <View
          style={[
            styles.orb,
            {
              backgroundColor: audioState.playing
                ? colors.flowSoft
                : colors.surface2,
              borderColor: colors.flow,
            },
          ]}>
          <Icon
            name={audioState.playing ? 'AudioLines' : 'Headphones'}
            className="text-primary w-9 h-9"
          />
        </View>
        <AppText raw style={[styles.position, {color: colors.ink3}]}>
          {t('LR_SENTENCE_PROGRESS', {
            current: currentIndex + 1,
            total: sentences.length,
          })}
        </AppText>

        {/* Transcript panel — hidden by default; "Hiện lời" reveals it. */}
        {showText ? (
          <View
            style={[
              styles.transcriptBox,
              {backgroundColor: colors.surface, borderColor: colors.hair},
            ]}>
            <View style={styles.transcriptHeaderRow}>
              {currentSentence ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('LR_TRANSLATE_SENTENCE')}
                  onPress={() =>
                    dispatch(
                      toggleSentenceTranslation({
                        sentenceId: currentSentence.id,
                      }),
                    )
                  }
                  style={[
                    styles.translateBadge,
                    {backgroundColor: colors.flowSoft},
                  ]}>
                  <AppText
                    raw
                    style={[styles.translateBadgeText, {color: colors.flowInk}]}>
                    {t('LR_TRANSLATE_SENTENCE')}
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            {/* The current sentence, Items tappable (same absorption flow). */}
            {currentSentence ? (
              <AppText raw style={styles.transcript}>
                {currentSentence.spans.map((span, spanIdx) => {
                  if (span.kind === 'text') {
                    return (
                      <AppText
                        raw
                        key={spanIdx}
                        style={[styles.transcript, {color: colors.ink}]}>
                        {span.text}
                      </AppText>
                    );
                  }
                  const item = itemsById[span.itemId];
                  if (!item) return null;
                  const absorbed = session.decided[span.itemId] === 'absorbed';
                  return (
                    <AppText
                      raw
                      key={spanIdx}
                      accessibilityRole="button"
                      accessibilityLabel={item.headword}
                      onPress={() => dispatch(tapItem({itemId: span.itemId}))}
                      style={[
                        styles.transcriptItem,
                        {
                          color: absorbed ? colors.warmInk : colors.flowInk,
                          backgroundColor: absorbed
                            ? colors.warmSoft
                            : colors.flowSoft,
                        },
                      ]}>
                      {item.headword}
                    </AppText>
                  );
                })}
              </AppText>
            ) : null}

            {/* Revealed per-sentence translation. */}
            {currentSentence &&
            session.revealedSentences[currentSentence.id] ? (
              <AppText
                raw
                style={[styles.transcriptTranslation, {color: colors.flowInk}]}>
                {currentSentence.translation}
              </AppText>
            ) : null}

            {/* Replay an individual Item's audio span (Item timestamps). */}
            {currentSentence
              ? currentSentence.spans
                  .filter(span => span.kind === 'item')
                  .map(span => {
                    const itemSpan = span as {kind: 'item'; itemId: string};
                    const item = itemsById[itemSpan.itemId];
                    const hasTimestamp = audio.itemTimestamps.some(
                      ts => ts.itemId === itemSpan.itemId,
                    );
                    if (!item || !hasTimestamp) return null;
                    const replaying =
                      audioState.replayingItemId === itemSpan.itemId;
                    return (
                      <Pressable
                        key={itemSpan.itemId}
                        accessibilityRole="button"
                        accessibilityLabel={t('LR_REPLAY_ITEM', {
                          headword: item.headword,
                        })}
                        onPress={() => audioState.replayItem(itemSpan.itemId)}
                        style={styles.replayItemRow}>
                        <Icon
                          name="RotateCcw"
                          className={
                            replaying
                              ? 'text-warm w-4 h-4'
                              : 'text-primary w-4 h-4'
                          }
                        />
                        <AppText
                          raw
                          style={[
                            styles.replayItemText,
                            {color: replaying ? colors.warmInk : colors.flowInk},
                          ]}>
                          {t('LR_REPLAY_ITEM', {headword: item.headword})}
                        </AppText>
                      </Pressable>
                    );
                  })
              : null}
          </View>
        ) : (
          <View
            style={[
              styles.hiddenBox,
              {backgroundColor: colors.surface2, borderColor: colors.hair},
            ]}>
            <AppText raw style={[styles.hiddenHint, {color: colors.ink3}]}>
              ◌ {t('LR_HIDDEN_HINT')}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('LR_REVEAL_TEXT')}
              onPress={() => setTextRevealed(true)}
              style={[styles.revealBtn, {backgroundColor: colors.flowSoft}]}>
              <Icon name="Eye" className="text-flowInk w-4 h-4" />
              <AppText raw style={[styles.revealText, {color: colors.flowInk}]}>
                {t('LR_REVEAL_TEXT')}
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Transport controls: ⏮ · 🐢 chậm · ⏯ · ↻ nghe lại · ⏭. */}
        <View style={styles.controlsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_PREV_SENTENCE')}
            onPress={audioState.prevSentence}
            hitSlop={8}
            style={styles.ctrlBtn}>
            <Icon name="SkipBack" className="text-foreground w-6 h-6" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: audioState.slow}}
            accessibilityLabel={t('LR_SLOW')}
            onPress={audioState.toggleSlow}
            style={[
              styles.slowBtn,
              {
                backgroundColor: audioState.slow
                  ? colors.flowSoft
                  : colors.surface2,
              },
            ]}>
            <Icon
              name="Rabbit"
              className={
                audioState.slow ? 'text-flowInk w-4 h-4' : 'text-ink2 w-4 h-4'
              }
            />
            <AppText
              raw
              style={[
                styles.slowText,
                {color: audioState.slow ? colors.flowInk : colors.ink2},
              ]}>
              {t('LR_SLOW')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              audioState.playing ? t('LR_PAUSE') : t('LR_PLAY')
            }
            onPress={audioState.togglePlay}
            style={[styles.playBtn, {backgroundColor: colors.flow}]}>
            <Icon
              name={audioState.playing ? 'Pause' : 'Play'}
              className="text-onFlow w-7 h-7"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_REPLAY_SENTENCE')}
            onPress={() => audioState.playSentence(currentIndex)}
            style={[styles.slowBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="RotateCcw" className="text-ink2 w-4 h-4" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_NEXT_SENTENCE')}
            onPress={audioState.nextSentence}
            hitSlop={8}
            style={styles.ctrlBtn}>
            <Icon name="SkipForward" className="text-foreground w-6 h-6" />
          </Pressable>
        </View>

        {/* Karaoke (read-along) toggle — beginner on-ramp. */}
        <View
          style={[
            styles.karaokeRow,
            {borderColor: colors.hair, backgroundColor: colors.surface},
          ]}>
          <AppText raw style={[styles.karaokeLabel, {color: colors.ink2}]}>
            {t('LR_KARAOKE')}
          </AppText>
          <Switch
            value={karaoke}
            onValueChange={setKaraoke}
            size="sm"
            trackClassName={karaoke ? 'bg-flow' : undefined}
          />
        </View>
      </ScrollView>

      {/* Open Item meaning card overlay (the absorption gesture's reveal). */}
      {openItem ? (
        <View
          style={[styles.cardOverlay, {bottom: 96 + insets.bottom}]}
          pointerEvents="box-none">
          <ItemMeaningCard item={openItem} onClose={() => dispatch(closeCard())} />
        </View>
      ) : null}

      {/* Footer: progress + Complete (gated on all Items decided). */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 14 + insets.bottom,
          },
        ]}>
        <AppText raw style={[styles.progressText, {color: colors.ink3}]}>
          {t('LP_DECIDED_PROGRESS', {decided: decidedCount, total})}
        </AppText>
        <AppButton
          variant="primary"
          className="flex-1"
          disabled={!allDecided}
          onPress={handleComplete}
          accessibilityLabel={t('LP_COMPLETE')}>
          <AppText raw style={[styles.completeText, {color: colors.onFlow}]}>
            {t('LP_COMPLETE')}
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
  closeBtn: {paddingRight: 4},
  headerTitle: {flex: 1, minWidth: 0},
  northStarWrap: {alignItems: 'center', minWidth: 64},
  northStarLabel: {
    fontFamily: InflowFonts.ui.semibold,
    fontSize: 9.5,
    marginTop: -2,
  },
  body: {flex: 1},
  bodyContent: {paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, alignItems: 'center'},
  orb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  position: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 16,
  },
  hiddenBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
  },
  hiddenHint: {fontFamily: InflowFonts.ui.regular, fontSize: 13},
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  revealText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  transcriptBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  transcriptHeaderRow: {flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6},
  translateBadge: {borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3},
  translateBadgeText: {fontFamily: InflowFonts.ui.bold, fontSize: 11},
  transcript: {fontFamily: InflowFonts.reading.regular, fontSize: 18, lineHeight: 28},
  transcriptItem: {
    fontFamily: InflowFonts.reading.medium,
    fontSize: 18,
    borderRadius: 5,
    overflow: 'hidden',
  },
  transcriptTranslation: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 14.5,
    marginTop: 10,
    lineHeight: 21,
  },
  replayItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },
  replayItemText: {fontFamily: InflowFonts.ui.semibold, fontSize: 13},
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 22,
  },
  ctrlBtn: {padding: 4},
  slowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 38,
    borderRadius: 999,
  },
  slowText: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  karaokeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 26,
  },
  karaokeLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5},
  cardOverlay: {position: 'absolute', left: 14, right: 14},
  footer: {
    paddingHorizontal: 22,
    paddingTop: 13,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressText: {fontFamily: InflowFonts.ui.bold, fontSize: 11.5, flexShrink: 0},
  completeText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonListeningPlayer.displayName = 'LessonListeningPlayer';
