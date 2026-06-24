import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon} from '@/components/ui';
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
 * first (real listening, not reading-along). The "now playing" orb anchors the
 * surface; controls sit in a transport bar (⏮ · 🐢 chậm · ↻ nghe lại · 👀
 * karaoke · ⏭). "Hiện lời" reveals the current sentence, which then carries the
 * *same* tappable-Item absorption flow as Reading (tap = reveal meaning + mark
 * Absorbed + North Star +1) plus a per-sentence translation toggle ("🌐 dịch")
 * and a per-Item audio-span replay ("↻ Nghe lại riêng …", driven by the
 * shared-layer Item timestamps). The optional **karaoke (read-along)** toggle
 * keeps the text visible as a gentler on-ramp for beginners.
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
  const progressPct =
    sentences.length === 0 ? 0 : ((currentIndex + 1) / sentences.length) * 100;

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
      {/* Header chrome: close · Source title + meta · North Star pill. */}
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
          <AppText
            raw
            style={[styles.titleText, {color: colors.ink}]}
            numberOfLines={1}>
            {audio.sourceLabel}
          </AppText>
          <AppText
            raw
            style={[styles.titleMeta, {color: colors.ink3}]}
            numberOfLines={1}>
            {t('LP_LISTEN_META', {source: lesson.topic, cefr: lesson.cefr})}
          </AppText>
        </View>
        <NorthStarCounter
          value={northStarLive}
          floatKey={session.absorbFloatKey}
          variant="pill"
        />
      </View>

      {/* Progress bar + the current sentence-position pill (câu N/M). */}
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, {backgroundColor: colors.surface2}]}>
          <View
            style={[
              styles.progressFill,
              {width: `${progressPct}%`, backgroundColor: colors.flow},
            ]}
          />
        </View>
        <View style={[styles.sentencePill, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.sentencePillText, {color: colors.flowInk}]}>
            {t('LP_LISTEN_SENTENCE_PILL', {
              current: currentIndex + 1,
              total: sentences.length,
            })}
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* The "now playing" orb — concentric flow rings + gradient core. */}
        <View style={styles.orbWrap}>
          <View style={[styles.orbRing, {borderColor: colors.flow}]} />
          <View
            style={[
              styles.orbRing,
              styles.orbRingInner,
              {borderColor: colors.flow},
            ]}
          />
          <View
            style={[
              styles.orbCore,
              {
                backgroundColor: audioState.playing
                  ? colors.flow
                  : colors.flowPress,
              },
            ]}>
            <Icon
              name={audioState.playing ? 'AudioLines' : 'Headphones'}
              className="text-onFlow w-8 h-8"
            />
          </View>
        </View>

        {/* Slow-mode badge (🐢 0.7× — chậm lại), only while slowed. */}
        {audioState.slow ? (
          <View style={[styles.slowBadge, {backgroundColor: colors.warmSoft}]}>
            <AppText raw style={[styles.slowBadgeText, {color: colors.warmInk}]}>
              {t('LP_LISTEN_SLOW_BADGE')}
            </AppText>
          </View>
        ) : null}

        <AppText raw style={[styles.position, {color: colors.ink2}]}>
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
            {/* The current sentence, Items tappable (same absorption flow),
                led by the per-sentence VI translation badge. */}
            {currentSentence ? (
              <AppText raw style={styles.transcript}>
                <AppText
                  raw
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
                    styles.viBadge,
                    {color: colors.flowInk, backgroundColor: colors.flowSoft},
                  ]}>
                  VI{' '}
                </AppText>
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

            {/* Sentence actions: 🌐 dịch + per-Item audio-span replay. */}
            <View style={styles.transcriptActions}>
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
                    styles.actionBtn,
                    {borderColor: colors.hair, backgroundColor: colors.surface},
                  ]}>
                  <Icon name="Languages" className="text-ink2 w-4 h-4" />
                  <AppText
                    raw
                    style={[styles.actionBtnText, {color: colors.ink2}]}>
                    {t('LR_TRANSLATE_SENTENCE')}
                  </AppText>
                </Pressable>
              ) : null}

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
                          onPress={() =>
                            audioState.replayItem(itemSpan.itemId)
                          }
                          style={[
                            styles.actionBtn,
                            {
                              borderColor: replaying
                                ? colors.warm
                                : colors.hair,
                              backgroundColor: replaying
                                ? colors.warmSoft
                                : colors.surface,
                            },
                          ]}>
                          <Icon
                            name="RotateCcw"
                            className={
                              replaying
                                ? 'text-warm w-4 h-4'
                                : 'text-ink2 w-4 h-4'
                            }
                          />
                          <AppText
                            raw
                            style={[
                              styles.actionBtnText,
                              {
                                color: replaying ? colors.warmInk : colors.ink2,
                              },
                            ]}
                            numberOfLines={1}>
                            {t('LR_REPLAY_ITEM', {headword: item.headword})}
                          </AppText>
                        </Pressable>
                      );
                    })
                : null}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.hiddenBox,
              {backgroundColor: colors.surface, borderColor: colors.hair},
            ]}>
            <AppText raw style={[styles.hiddenHint, {color: colors.ink3}]}>
              ◌ {t('LR_HIDDEN_HINT')}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('LR_REVEAL_TEXT')}
              onPress={() => setTextRevealed(true)}
              style={[styles.revealBtn, {backgroundColor: colors.flow}]}>
              <Icon name="Eye" className="text-onFlow w-4 h-4" />
              <AppText raw style={[styles.revealText, {color: colors.onFlow}]}>
                {t('LR_REVEAL_TEXT')}
              </AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Open Item meaning card overlay (the absorption gesture's reveal). */}
      {openItem ? (
        <View
          style={[styles.cardOverlay, {bottom: 150 + insets.bottom}]}
          pointerEvents="box-none">
          <ItemMeaningCard item={openItem} onClose={() => dispatch(closeCard())} />
        </View>
      ) : null}

      {/* Footer: transport bar (⏮ · 🐢 chậm · ↻ nghe lại · 👀 karaoke · ⏭)
          + progress + Complete (gated on all Items decided). */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 14 + insets.bottom,
          },
        ]}>
        <View style={styles.transportRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_PREV_SENTENCE')}
            onPress={audioState.prevSentence}
            style={[styles.roundBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="SkipBack" className="text-ink2 w-5 h-5" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: audioState.slow}}
            accessibilityLabel={t('LR_SLOW')}
            onPress={audioState.toggleSlow}
            style={styles.labelCtrl}>
            <Icon
              name="Rabbit"
              className={
                audioState.slow ? 'text-flowInk w-6 h-6' : 'text-ink2 w-6 h-6'
              }
            />
            <AppText
              raw
              style={[
                styles.ctrlLabel,
                {color: audioState.slow ? colors.flowInk : colors.ink2},
              ]}>
              {t('LR_SLOW')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={audioState.playing ? t('LR_PAUSE') : t('LR_PLAY')}
            onPress={audioState.togglePlay}
            style={styles.bigCtrl}>
            <View
              style={[styles.bigCtrlCircle, {backgroundColor: colors.flowSoft}]}>
              <Icon
                name={audioState.playing ? 'Pause' : 'Play'}
                className="text-flowInk w-6 h-6"
              />
            </View>
            <AppText raw style={[styles.ctrlLabel, {color: colors.flowInk}]}>
              {t('LP_LISTEN_REPLAY')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: karaoke}}
            accessibilityLabel={t('LR_KARAOKE')}
            onPress={() => setKaraoke(prev => !prev)}
            style={styles.labelCtrl}>
            <Icon
              name="Eye"
              className={karaoke ? 'text-flowInk w-6 h-6' : 'text-ink2 w-6 h-6'}
            />
            <AppText
              raw
              style={[
                styles.ctrlLabel,
                {color: karaoke ? colors.flowInk : colors.ink2},
              ]}>
              {t('LP_LISTEN_KARAOKE')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_NEXT_SENTENCE')}
            onPress={audioState.nextSentence}
            style={[styles.roundBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="SkipForward" className="text-ink2 w-5 h-5" />
          </Pressable>
        </View>

        <AppText raw style={[styles.progressText, {color: colors.ink3}]}>
          {t('LP_DECIDED_PROGRESS', {decided: decidedCount, total})}
        </AppText>
        <AppButton
          variant="primary"
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
  progressTrack: {flex: 1, height: 6, borderRadius: 4, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 4},
  sentencePill: {borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4},
  sentencePillText: {fontFamily: InflowFonts.ui.bold, fontSize: 11},
  body: {flex: 1},
  bodyContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  orbWrap: {
    width: 128,
    height: 128,
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    opacity: 0.35,
  },
  orbRingInner: {width: 106, height: 106, borderRadius: 53, opacity: 0.5},
  orbCore: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slowBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  slowBadgeText: {fontFamily: InflowFonts.ui.bold, fontSize: 11},
  position: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 16,
  },
  hiddenBox: {
    width: '100%',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 14,
  },
  hiddenHint: {fontFamily: InflowFonts.ui.regular, fontSize: 13},
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
  },
  revealText: {fontFamily: InflowFonts.ui.bold, fontSize: 14.5},
  transcriptBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  viBadge: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 9,
    borderRadius: 4,
    overflow: 'hidden',
  },
  transcript: {
    fontFamily: InflowFonts.reading.regular,
    fontSize: 18,
    lineHeight: 31,
  },
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
  transcriptActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  actionBtnText: {fontFamily: InflowFonts.ui.semibold, fontSize: 12.5},
  cardOverlay: {position: 'absolute', left: 14, right: 14},
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCtrl: {alignItems: 'center', gap: 2, minWidth: 46},
  ctrlLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 10},
  bigCtrl: {alignItems: 'center', gap: 2},
  bigCtrlCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 11.5,
    textAlign: 'center',
  },
  completeText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonListeningPlayer.displayName = 'LessonListeningPlayer';
