import React, {useEffect, useMemo} from 'react';
import {ImageBackground, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  closeCard,
  completeSession,
  startSession,
  tapItem,
  toggleSentenceTranslation,
} from '../lessonSessionSlice';
import type {Item, Lesson, PassageSentence} from '../types';
import {
  useListeningReplayAudio,
  type LessonAudioClock,
} from '../useListeningReplayAudio';
import ItemMeaningCard from './ItemMeaningCard';

export interface LessonListeningPlayerProps {
  /** An audio Lesson — `lesson.audio` MUST be present (Listening Replay). */
  lesson: Lesson;
  /** Cumulative North Star before this Lesson (Absorbed-this-session adds on). */
  northStarBase: number;
  /**
   * Listening Replay chrome variant (screens.md §10): `video` → "Xem & nghe"
   * watch header + a "CC bật" subtitle pill (LP4 `rak7A`); `podcast` → "Đang
   * nghe" header + a "Transcript" pill (LP4 `vPf0d`). Defaults to the Lesson's
   * own `audio.kind`.
   */
  variant?: 'video' | 'podcast';
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Called when the learner completes the Lesson (Tiếp tục →). */
  onCompleted: () => void;
  /**
   * Test/seam hook: supply a custom audio clock factory (e.g. a real audio
   * backend, or a deterministic fake). Defaults to the mock JS clock.
   */
  makeClock?: (durationSec: number) => LessonAudioClock;
}

/** mm:ss formatter for the seek bar labels. */
function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/**
 * Lesson Player — Listening Replay surface (screens.md §10; design nodes
 * `rak7A` LP4 Xem & Nghe and `vPf0d` LP4 Nghe — Podcast). The Practice Mode
 * layered on the common core for audio Sources (ADR-0002).
 *
 * The surface is a **media player**: a poster/video frame caps the screen with
 * the now-playing sentence burned in as a caption, then a three-line transcript
 * window (previous · current card · next) keeps the learner oriented. The
 * current sentence carries the *same* tappable-Item absorption flow as Reading
 * (tap = reveal meaning + mark Absorbed) plus a per-sentence VI translation and
 * a "🔁 Nghe lại câu" / "🐢 Chậm" control pair, all driven by the shared-layer
 * timestamps. A transport bar (⏮ · 🐢 0.7× · ▶/⏸ · 👀 karaoke · ⏭) and a seek
 * bar sit in the footer above the "Tiếp tục →" CTA.
 *
 * This component does not alter Reading behavior; it reuses the same session
 * reducer for the absorption gesture and is selected by Source type (presence
 * of `lesson.audio`).
 */
export default function LessonListeningPlayer({
  lesson,
  northStarBase,
  variant,
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
  const kind = variant ?? audio.kind;
  const sentences = lesson.passage.sentences;

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

  const currentIndex = audioState.currentSentenceIndex;
  const currentSentence = sentences[currentIndex] as
    | PassageSentence
    | undefined;
  const prevSentence = sentences[currentIndex - 1] as
    | PassageSentence
    | undefined;
  const nextSentence = sentences[currentIndex + 1] as
    | PassageSentence
    | undefined;

  const progressPct =
    audio.durationSec === 0
      ? 0
      : Math.min(100, (audioState.positionSec / audio.durationSec) * 100);

  const openItem = session.openCardItemId
    ? itemsById[session.openCardItemId]
    : null;

  const handleComplete = () => {
    dispatch(completeSession());
    onCompleted();
  };

  // Plain-text of a sentence (caption fallback when split spans aren't needed).
  const sentenceText = (sentence: PassageSentence | undefined): string =>
    sentence
      ? sentence.spans
          .map(span =>
            span.kind === 'text'
              ? span.text
              : itemsById[span.itemId]?.headword ?? '',
          )
          .join('')
      : '';

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      {/* Header chrome: ✕ · centered title · CC/Transcript pill. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.closeIcon, {color: colors.ink2}]}>
            ✕
          </AppText>
        </Pressable>
        <View style={styles.headerSpacer} />
        <AppText raw style={[styles.titleText, {color: colors.ink}]}>
          {t(kind === 'podcast' ? 'LP_LISTEN_TITLE' : 'LP_WATCH_TITLE')}
        </AppText>
        <View style={styles.headerSpacer} />
        <View style={[styles.ccPill, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.ccPillText, {color: colors.flowInk}]}>
            {t(kind === 'podcast' ? 'LP_LISTEN_TRANSCRIPT' : 'LP_WATCH_CC')}
          </AppText>
        </View>
      </View>

      {/* Media frame — poster fill, bottom scrim, now-playing caption. */}
      <ImageBackground
        source={
          audio.thumbnailUrl
            ? typeof audio.thumbnailUrl === 'string'
              ? {uri: audio.thumbnailUrl}
              : audio.thumbnailUrl
            : undefined
        }
        resizeMode="cover"
        style={[styles.media, {backgroundColor: colors.surface2}]}>
        <View style={styles.mediaScrim} />
        <View style={styles.mediaCaption}>
          <AppText raw style={styles.captionText}>
            {currentSentence?.spans.map((span, i) => {
              if (span.kind === 'text') {
                return (
                  <AppText raw key={i} style={styles.captionPlain}>
                    {span.text}
                  </AppText>
                );
              }
              const item = itemsById[span.itemId];
              return (
                <AppText raw key={i} style={styles.captionItem}>
                  {item?.headword ?? ''}
                </AppText>
              );
            })}
          </AppText>
        </View>
      </ImageBackground>

      {/* Body — previous · current card · next transcript window. */}
      <View style={styles.body}>
        <AppText
          raw
          numberOfLines={1}
          style={[styles.sidelineText, {color: colors.ink3}]}>
          {sentenceText(prevSentence)}
        </AppText>

        <View style={styles.sideGap} />

        {/* Current sentence card — tappable Items + VI translation + controls. */}
        <View
          style={[
            styles.currentCard,
            {backgroundColor: colors.flowSoft, borderColor: colors.flow},
          ]}>
          <AppText raw style={styles.currentLine}>
            {currentSentence?.spans.map((span, i) => {
              if (span.kind === 'text') {
                return (
                  <AppText
                    raw
                    key={i}
                    style={[styles.currentPlain, {color: colors.ink}]}>
                    {span.text}
                  </AppText>
                );
              }
              const item = itemsById[span.itemId];
              if (!item) {
                return null;
              }
              return (
                <AppText
                  raw
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={item.headword}
                  onPress={() => dispatch(tapItem({itemId: span.itemId}))}
                  style={[styles.currentItem, {color: colors.flowInk}]}>
                  {item.headword}
                </AppText>
              );
            })}
          </AppText>

          {currentSentence ? (
            <AppText
              raw
              accessibilityRole="button"
              accessibilityLabel={t('LR_TRANSLATE_SENTENCE')}
              onPress={() =>
                dispatch(
                  toggleSentenceTranslation({sentenceId: currentSentence.id}),
                )
              }
              style={[styles.currentTr, {color: colors.flowInk}]}>
              {currentSentence.translation}
            </AppText>
          ) : null}

          <View style={styles.cardCtl}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('LR_REPLAY_SENTENCE')}
              onPress={() => audioState.playSentence(currentIndex)}
              style={[
                styles.ctlChip,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <AppText raw style={[styles.ctlChipText, {color: colors.ink2}]}>
                {t('LR_REPLAY_SENTENCE_CTRL')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: audioState.slow}}
              accessibilityLabel={t('LR_SLOW')}
              onPress={audioState.toggleSlow}
              style={[
                styles.ctlChip,
                {
                  backgroundColor: audioState.slow
                    ? colors.flowSoft
                    : colors.surface,
                  borderColor: audioState.slow ? colors.flow : colors.border,
                },
              ]}>
              <AppText
                raw
                style={[
                  styles.ctlChipText,
                  {color: audioState.slow ? colors.flowInk : colors.ink2},
                ]}>
                {t('LR_SLOW_CTRL')}
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.sideGap} />

        <AppText
          raw
          numberOfLines={1}
          style={[styles.sidelineText, {color: colors.ink3}]}>
          {sentenceText(nextSentence)}
        </AppText>
      </View>

      {/* Open Item meaning card overlay (the absorption gesture's reveal). */}
      {openItem ? (
        <View
          style={[styles.cardOverlay, {bottom: 200 + insets.bottom}]}
          pointerEvents="box-none">
          <ItemMeaningCard
            item={openItem}
            onClose={() => dispatch(closeCard())}
          />
        </View>
      ) : null}

      {/* Footer: seek bar · transport · Tiếp tục → CTA. */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 14 + insets.bottom,
          },
        ]}>
        <View style={styles.seekRow}>
          <AppText raw style={[styles.seekTime, {color: colors.ink3}]}>
            {fmtTime(audioState.positionSec)}
          </AppText>
          <View style={[styles.seekTrack, {backgroundColor: colors.surface2}]}>
            <View
              style={[
                styles.seekFill,
                {width: `${progressPct}%`, backgroundColor: colors.flow},
              ]}
            />
          </View>
          <AppText raw style={[styles.seekTime, {color: colors.ink3}]}>
            {fmtTime(audio.durationSec)}
          </AppText>
        </View>

        <View style={styles.transport}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_PREV_SENTENCE')}
            onPress={audioState.prevSentence}
            style={[styles.roundBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="SkipBack" className="text-ink2 w-[18px] h-[18px]" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: audioState.slow}}
            accessibilityLabel={t('LR_SLOW')}
            onPress={audioState.toggleSlow}
            style={styles.labelCtrl}>
            <AppText raw style={styles.ctrlEmoji}>
              🐢
            </AppText>
            <AppText
              raw
              style={[
                styles.ctrlLabel,
                {color: audioState.slow ? colors.flowInk : colors.ink2},
              ]}>
              {t('LR_SPEED_LABEL')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={audioState.playing ? t('LR_PAUSE') : t('LR_PLAY')}
            onPress={audioState.togglePlay}
            style={[styles.playBtn, {backgroundColor: colors.flow}]}>
            <Icon
              name={audioState.playing ? 'Pause' : 'Play'}
              className="text-onFlow w-[22px] h-[22px]"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_KARAOKE')}
            onPress={() => audioState.playSentence(currentIndex)}
            style={styles.labelCtrl}>
            <AppText raw style={styles.ctrlEmoji}>
              👀
            </AppText>
            <AppText raw style={[styles.ctrlLabel, {color: colors.ink2}]}>
              {t('LP_LISTEN_KARAOKE')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LR_NEXT_SENTENCE')}
            onPress={audioState.nextSentence}
            style={[styles.roundBtn, {backgroundColor: colors.surface2}]}>
            <Icon name="SkipForward" className="text-ink2 w-[18px] h-[18px]" />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LP_WATCH_CONTINUE')}
          onPress={handleComplete}
          style={[styles.cta, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {t('LP_WATCH_CONTINUE')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 11,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {fontFamily: InflowFonts.ui.regular, fontSize: 15},
  headerSpacer: {flex: 1},
  titleText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  ccPill: {borderRadius: 9, paddingVertical: 5, paddingHorizontal: 10},
  ccPillText: {fontFamily: InflowFonts.ui.bold, fontSize: 11.5},
  media: {height: 197, width: '100%', justifyContent: 'flex-end'},
  mediaScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 77,
    backgroundColor: '#000000A8',
  },
  mediaCaption: {paddingHorizontal: 24, paddingBottom: 16},
  captionText: {fontFamily: InflowFonts.reading.regular, fontSize: 19},
  captionPlain: {
    fontFamily: InflowFonts.reading.medium,
    fontSize: 19,
    color: '#FFFFFF',
  },
  captionItem: {
    fontFamily: InflowFonts.reading.bold,
    fontSize: 19,
    color: '#FFE08A',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  sidelineText: {
    fontFamily: InflowFonts.reading.regular,
    fontSize: 17,
    lineHeight: 25.5,
    opacity: 0.55,
  },
  sideGap: {height: 14},
  currentCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  currentLine: {fontFamily: InflowFonts.reading.regular, fontSize: 20},
  currentPlain: {fontFamily: InflowFonts.reading.regular, fontSize: 20},
  currentItem: {fontFamily: InflowFonts.reading.bold, fontSize: 20},
  currentTr: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 16,
    marginTop: 6,
  },
  cardCtl: {flexDirection: 'row', gap: 9, marginTop: 12},
  ctlChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  ctlChipText: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},
  cardOverlay: {position: 'absolute', left: 14, right: 14},
  footer: {
    paddingTop: 10,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  seekRow: {flexDirection: 'row', alignItems: 'center', gap: 9},
  seekTime: {fontFamily: InflowFonts.ui.regular, fontSize: 11},
  seekTrack: {flex: 1, height: 4, borderRadius: 3, overflow: 'hidden'},
  seekFill: {height: '100%', borderRadius: 3},
  transport: {
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
  labelCtrl: {alignItems: 'center', gap: 2},
  ctrlEmoji: {fontSize: 18, lineHeight: 22},
  ctrlLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 10},
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {borderRadius: 15, paddingVertical: 15, alignItems: 'center'},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 15.5},
});

LessonListeningPlayer.displayName = 'LessonListeningPlayer';
