import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {ItemKind} from '@/components/ui/ItemToken';
import type {Lesson, LessonCover} from '../types';

export interface LessonCoverScreenProps {
  lesson: Lesson;
  /** Cover presentation metadata (per Source type). */
  cover: LessonCover;
  /** Display title for the Cover (defaults to `lesson.title`). */
  title?: string;
  /** Close the Lesson Player (the ✕ over the hero). */
  onClose: () => void;
  /** "Bắt đầu học" — advance to the Warm-up. */
  onStart: () => void;
  /** "Lướt nhanh" — open the Warm-up list directly. */
  onOpenList?: () => void;
  /** Share (↗) — preview the next per-Source-type Cover variant. */
  onShare?: () => void;
}

/** Per-Source-type hero pill background (matches the pen's source pills). */
const PILL_BG: Record<LessonCover['sourceType'], string> = {
  youtube: '#FF0000E6',
  article: '#111827E6',
  podcast: '#7C3AEDE6',
  text: '#0F766EE6',
};

/**
 * Lesson Player — **Cover** (screens.md §10 LP1 · `ZeE5Q`; variants `LvMs5`
 * Article / `tiWTV` Podcast / `fvpcK` Raw text). The entry screen of the
 * flagship loop: a Source-typed hero, the Source title + provenance, the
 * difficulty / length meta, and the "Bạn sẽ nạp được" preview of the projected
 * Item-type counts (Vocabulary / Chunk / Grammar Point), then "Bắt đầu học".
 *
 * Only the chrome (hero, Source pill, duration, secondary link) switches on the
 * Source type — the learning core preview is identical (ADR-0001: one analyzed
 * Lesson, per-learner projection).
 */
export default function LessonCoverScreen({
  lesson,
  cover,
  title,
  onClose,
  onStart,
  onOpenList,
  onShare,
}: LessonCoverScreenProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const counts = lesson.items.reduce(
    (acc, it) => {
      acc[it.type] += 1;
      return acc;
    },
    {vocabulary: 0, chunk: 0, grammarPoint: 0} as Record<ItemKind, number>,
  );

  const isAudio = cover.sourceType === 'youtube' || cover.sourceType === 'podcast';

  // Hero: a gradient for Raw text (quote treatment), an image-like surface
  // otherwise. We use a flat dark surface as the thumbnail stand-in (bundled
  // imagery arrives with the Source importer); the scrim + chrome match the pen.
  const heroBody = (
    <View style={styles.heroInner}>
      {/* Scrim — bottom fade so chrome stays legible. */}
      <View style={styles.scrim} pointerEvents="none" />

      {cover.sourceType === 'text' ? (
        <AppText raw style={styles.quoteGlyph}>
          ❝
        </AppText>
      ) : null}

      {/* Top chrome: close · share. */}
      <View style={[styles.heroTop, {paddingTop: 14 + insets.top}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={styles.heroRound}>
          <AppText raw style={styles.heroRoundGlyph}>
            ✕
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onShare}
          hitSlop={8}
          style={styles.heroRound}>
          <AppText raw style={styles.heroRoundGlyph}>
            ↗
          </AppText>
        </Pressable>
      </View>

      {/* Source pill. */}
      <View
        style={[
          styles.srcPill,
          {top: 54 + insets.top, backgroundColor: PILL_BG[cover.sourceType]},
        ]}>
        <AppText raw style={styles.srcPillText}>
          {cover.sourcePillLabel}
        </AppText>
      </View>

      {/* Pasted-text preview (Raw text variant). */}
      {cover.textPreview ? (
        <AppText raw style={[styles.textPreview, {top: 104 + insets.top}]}>
          {cover.textPreview}
        </AppText>
      ) : null}

      {/* Play affordance (audio/video Sources only). */}
      {isAudio ? (
        <View style={[styles.playBtn, {top: 90 + insets.top}]}>
          <Icon name="Play" className="text-flow-press w-6 h-6" />
        </View>
      ) : null}

      {/* Duration / length badge. */}
      <View style={styles.durBadge}>
        <AppText raw style={styles.durText}>
          {cover.durationLabel}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg}]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero (248h). A teal gradient for Raw text (quote treatment), a dark
            thumbnail stand-in otherwise (bundled imagery arrives with the
            Source importer). */}
        <View
          style={[
            styles.hero,
            cover.sourceType === 'text' ? styles.heroGradient : styles.heroThumb,
          ]}>
          {heroBody}
        </View>

        {/* Body. */}
        <View style={styles.body}>
          <AppText raw style={[styles.originTag, {color: colors.warmInk}]}>
            {cover.originTag}
          </AppText>
          <AppText raw style={[styles.title, {color: colors.ink}]}>
            {title ?? lesson.title}
          </AppText>
          <AppText raw style={[styles.channel, {color: colors.ink3}]}>
            {cover.channelLine}
          </AppText>

          {/* Meta chips: CEFR · est. minutes · length. */}
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.metaChipText, {color: colors.flowInk}]}>
                {lesson.cefr}
              </AppText>
            </View>
            <View style={[styles.metaChip, {backgroundColor: colors.surface2}]}>
              <AppText raw style={[styles.metaChipText, {color: colors.ink2}]}>
                {t('LP_COVER_EST_MINUTES')}
              </AppText>
            </View>
            <View style={[styles.metaChip, {backgroundColor: colors.surface2}]}>
              <AppText raw style={[styles.metaChipText, {color: colors.ink2}]}>
                {cover.lengthChip}
              </AppText>
            </View>
          </View>

          {/* "Bạn sẽ nạp được" — Item-count preview. */}
          <View
            style={[
              styles.learnCard,
              {backgroundColor: colors.surface, borderColor: colors.hair},
            ]}>
            <View style={styles.learnHead}>
              <AppText raw style={[styles.learnTitle, {color: colors.ink}]}>
                {t('LP_COVER_PREVIEW_HEADING')}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={onOpenList}
                hitSlop={6}
                style={styles.openList}>
                <Icon name="List" className="text-flow-ink w-3.5 h-3.5" />
                <AppText raw style={[styles.openListText, {color: colors.flowInk}]}>
                  {t('LP_COVER_QUICK_SKIM')}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.statRow}>
              <StatTile
                emoji="📘"
                count={counts.vocabulary}
                label={t('LP_COVER_STAT_VOCAB')}
                bg={colors.flowSoft}
                ink={colors.ink}
                sub={colors.ink2}
              />
              <StatTile
                emoji="🧩"
                count={counts.chunk}
                label={t('LP_COVER_STAT_CHUNK')}
                bg={colors.flowSoft}
                ink={colors.ink}
                sub={colors.ink2}
              />
              <StatTile
                emoji="⚙"
                count={counts.grammarPoint}
                label={t('LP_COVER_STAT_GRAMMAR')}
                bg={colors.warmSoft}
                ink={colors.ink}
                sub={colors.ink2}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer: primary CTA + secondary "view original". */}
      <View style={[styles.footer, {paddingBottom: 16 + insets.bottom}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LP_COVER_START')}
          onPress={onStart}
          style={[styles.cta, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {t('LP_COVER_START')}
          </AppText>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            →
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secBtn}>
          <AppText raw style={[styles.secText, {color: colors.ink3}]}>
            {cover.originalLinkLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function StatTile({
  emoji,
  count,
  label,
  bg,
  ink,
  sub,
}: {
  emoji: string;
  count: number;
  label: string;
  bg: string;
  ink: string;
  sub: string;
}) {
  return (
    <View style={[styles.statTile, {backgroundColor: bg}]}>
      <AppText raw style={[styles.statEmoji, {color: ink}]}>
        {emoji}
      </AppText>
      <AppText raw style={[styles.statNum, {color: ink}]}>
        {count}
      </AppText>
      <AppText raw style={[styles.statLabel, {color: sub}]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 8},
  hero: {height: 248, overflow: 'hidden'},
  heroGradient: {backgroundColor: '#0F766E'},
  heroThumb: {backgroundColor: '#1A2230'},
  heroInner: {flex: 1},
  scrim: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 128, backgroundColor: '#00000059'},
  quoteGlyph: {
    position: 'absolute',
    left: 18,
    top: 6,
    fontFamily: InflowFonts.reading.bold,
    fontSize: 96,
    color: '#FFFFFF59',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  heroRound: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#00000059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRoundGlyph: {fontFamily: InflowFonts.ui.regular, fontSize: 15, color: '#FFFFFF'},
  srcPill: {
    position: 'absolute',
    left: 16,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  srcPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5, color: '#FFFFFF'},
  textPreview: {
    position: 'absolute',
    left: 24,
    width: 300,
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24.5,
    color: '#FFFFFFF2',
  },
  playBtn: {
    position: 'absolute',
    left: 158,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#000000A6',
  },
  durText: {fontFamily: InflowFonts.ui.bold, fontSize: 11, color: '#FFFFFF'},
  body: {paddingTop: 16, paddingHorizontal: 22},
  originTag: {fontFamily: InflowFonts.ui.bold, fontSize: 12},
  title: {fontFamily: InflowFonts.ui.extrabold, fontSize: 25, lineHeight: 28.75, marginTop: 9},
  channel: {fontFamily: InflowFonts.ui.regular, fontSize: 13, marginTop: 6},
  metaRow: {flexDirection: 'row', gap: 8, marginTop: 14},
  metaChip: {borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6},
  metaChipText: {fontFamily: InflowFonts.ui.bold, fontSize: 12},
  learnCard: {marginTop: 18, borderWidth: 1, borderRadius: 16, padding: 16},
  learnHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  learnTitle: {fontFamily: InflowFonts.ui.extrabold, fontSize: 13},
  openList: {flexDirection: 'row', alignItems: 'center', gap: 5},
  openListText: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  statRow: {flexDirection: 'row', gap: 10, marginTop: 12},
  statTile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 2,
  },
  statEmoji: {fontFamily: InflowFonts.ui.regular, fontSize: 17},
  statNum: {fontFamily: InflowFonts.ui.extrabold, fontSize: 19},
  statLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 11},
  footer: {paddingTop: 14, paddingHorizontal: 22, gap: 10},
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  secBtn: {alignItems: 'center', justifyContent: 'center', paddingVertical: 10},
  secText: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5},
});

LessonCoverScreen.displayName = 'LessonCoverScreen';
