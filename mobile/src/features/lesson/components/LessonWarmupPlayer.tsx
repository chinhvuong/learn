import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Item, WarmupGroup} from '../types';

export interface LessonWarmupPlayerProps {
  /** Warm-up deck order (Vocabulary → Chunk → Grammar Point). */
  order: Item[];
  /** Warm-up groups, for the list view. */
  groups: WarmupGroup[];
  /** Start the Warm-up in the list view (from the Cover's "Lướt nhanh"). */
  initialView?: 'deck' | 'list';
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** "Vào đọc luôn" / finished the deck → hand off to the Reading immersion. */
  onStartReading: () => void;
}

const GROUP_META: Record<
  Item['type'],
  {emoji: string; labelKey: string; kindKey: string}
> = {
  vocabulary: {emoji: '📘', labelKey: 'LP_WARMUP_GROUP_VOCAB', kindKey: 'LP_WARMUP_KIND_VOCAB'},
  chunk: {emoji: '🧩', labelKey: 'LP_WARMUP_GROUP_CHUNK', kindKey: 'LP_WARMUP_KIND_CHUNK'},
  grammarPoint: {emoji: '⚙', labelKey: 'LP_WARMUP_GROUP_GRAMMAR', kindKey: 'LP_WARMUP_KIND_GRAMMAR'},
};

/**
 * Lesson Player — **Warm-up** ("Làm nóng", screens.md §10 LP2 · `oFKYA` /
 * LP2b · `L8QvdJ`). A 30-second pre-reading skim so the learner meets a few key
 * Items before the immersion ("Gặp trước vài từ khoá để khi đọc bạn thấy trôi
 * hơn"). Two views, toggled in the header:
 *
 *   - **deck** — a swipeable card stack, one Item at a time (the default);
 *   - **list** — every Item grouped by type (Vocabulary / Chunk / Grammar Point)
 *     with count badges, for a faster glance.
 *
 * The Warm-up is a *preview*: it never marks Items Absorbed and never touches
 * the North Star — the absorption gesture lives on the Reading surface.
 */
export default function LessonWarmupPlayer({
  order,
  groups,
  initialView = 'deck',
  onClose,
  onStartReading,
}: LessonWarmupPlayerProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const [view, setView] = useState<'deck' | 'list'>(initialView);
  const [index, setIndex] = useState(0);
  const total = order.length;
  const item = order[Math.min(index, total - 1)];
  const last = index >= total - 1;

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
      {scale: enter.interpolate({inputRange: [0, 1], outputRange: [0.93, 1]})},
    ],
  };

  const next = () => {
    if (last) {
      onStartReading();
    } else {
      setIndex(i => Math.min(i + 1, total - 1));
    }
  };

  const groupCounts = useMemo(
    () => groups.map(g => ({type: g.type, count: g.items.length})),
    [groups],
  );

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg, paddingTop: insets.top}]}>
      {/* Header: close · "Làm nóng" · grid/list toggle. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.closeGlyph, {color: colors.ink2}]}>
            ✕
          </AppText>
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText raw style={[styles.headerTitleText, {color: colors.ink}]}>
            {t('LP_WARMUP_TITLE')}
          </AppText>
        </View>
        <View style={[styles.viewTog, {backgroundColor: colors.surface2}]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_WARMUP_VIEW_DECK')}
            accessibilityState={{selected: view === 'deck'}}
            onPress={() => setView('deck')}
            style={[styles.togBtn, view === 'deck' && {backgroundColor: colors.surface}]}>
            <Icon
              name="LayoutGrid"
              className={`w-4 h-4 ${view === 'deck' ? 'text-flow-ink' : 'text-ink-3'}`}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_WARMUP_VIEW_LIST')}
            accessibilityState={{selected: view === 'list'}}
            onPress={() => setView('list')}
            style={[styles.togBtn, view === 'list' && {backgroundColor: colors.surface}]}>
            <Icon
              name="List"
              className={`w-4 h-4 ${view === 'list' ? 'text-flow-ink' : 'text-ink-3'}`}
            />
          </Pressable>
        </View>
      </View>

      {view === 'deck' ? (
        <DeckView
          item={item}
          index={index}
          total={total}
          cardStyle={cardStyle}
          colors={colors}
          t={t}
        />
      ) : (
        <ListView groups={groups} groupCounts={groupCounts} colors={colors} t={t} />
      )}

      {/* Footer: primary CTA + secondary ghost. */}
      <View style={[styles.footer, {paddingBottom: 16 + insets.bottom}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'list' ? t('LP_WARMUP_TO_READING') : t('LP_WARMUP_NEXT')}
          onPress={next}
          style={[styles.cta, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {view === 'list' ? t('LP_WARMUP_TO_READING') : last ? t('LP_WARMUP_TO_READING') : t('LP_WARMUP_NEXT')}
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onStartReading} style={styles.ghost}>
          <AppText raw style={[styles.ghostText, {color: colors.ink3}]}>
            {view === 'list' ? t('LP_WARMUP_STUDY_EACH') : t('LP_WARMUP_SKIP')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

type Colors = ReturnType<typeof useColors>;
type TFn = ReturnType<typeof useTranslation>['t'];

/** Deck view (LP2 · `oFKYA`) — a stacked card carousel, one Item at a time. */
function DeckView({
  item,
  index,
  total,
  cardStyle,
  colors,
  t,
}: {
  item: Item;
  index: number;
  total: number;
  cardStyle: object;
  colors: Colors;
  t: TFn;
}) {
  if (!item) {
    return <View style={styles.deckBody} />;
  }
  const meta = GROUP_META[item.type];
  return (
    <View style={styles.deckBody}>
      <AppText raw style={[styles.kicker, {color: colors.warmInk}]}>
        {t('LP_WARMUP_KICKER')}
      </AppText>
      <AppText raw style={[styles.hint, {color: colors.ink2}]}>
        {t('LP_WARMUP_HINT')}
      </AppText>

      {/* Card deck — back cards peek behind the front card. */}
      <View style={styles.deck}>
        <View
          style={[
            styles.backCard,
            styles.backCard2,
            {backgroundColor: colors.surface, borderColor: colors.hair},
          ]}
        />
        <View
          style={[
            styles.backCard,
            styles.backCard1,
            {backgroundColor: colors.surface, borderColor: colors.hair},
          ]}
        />
        <Animated.View
          accessibilityLabel={item.headword}
          style={[
            styles.card,
            {backgroundColor: colors.surface, borderColor: colors.hair},
            cardStyle,
          ]}>
          <View style={[styles.kindPill, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={[styles.kindPillText, {color: colors.flowInk}]}>
              {meta.emoji} {t(meta.kindKey)}
            </AppText>
          </View>

          <AppText raw style={[styles.word, {color: colors.ink}]}>
            {item.headword}
          </AppText>

          {item.ipa ? (
            <View style={styles.ipaRow}>
              <AppText raw style={[styles.ipa, {color: colors.ink3}]}>
                {item.ipa}
              </AppText>
              <View style={[styles.spk, {backgroundColor: colors.flowSoft}]}>
                <Icon name="Volume2" className="text-flow-ink w-4 h-4" />
              </View>
            </View>
          ) : null}

          <AppText raw style={[styles.meaning, {color: colors.warmInk}]}>
            → {item.meaning}
          </AppText>

          {item.pattern ? (
            <AppText raw style={[styles.pattern, {color: colors.ink2}]}>
              ⚙ {item.pattern}
            </AppText>
          ) : null}

          <View style={[styles.divider, {backgroundColor: colors.hair}]} />
          <AppText raw style={[styles.example, {color: colors.ink3}]}>
            {t('LP_IN_PASSAGE')}: “{item.example}”
          </AppText>
        </Animated.View>
      </View>

      {/* Progress dots. */}
      <View style={styles.dots}>
        {Array.from({length: total}).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index
                ? {backgroundColor: colors.flow, width: 22}
                : {backgroundColor: colors.hair},
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/** List view (LP2b · `L8QvdJ`) — every Item grouped by type with count badges. */
function ListView({
  groups,
  groupCounts,
  colors,
  t,
}: {
  groups: WarmupGroup[];
  groupCounts: {type: Item['type']; count: number}[];
  colors: Colors;
  t: TFn;
}) {
  return (
    <View style={styles.listBody}>
      <View style={styles.listSub}>
        <AppText raw style={[styles.listSubCount, {color: colors.warmInk}]}>
          {t('LP_WARMUP_LIST_COUNT', {
            count: groupCounts.reduce((a, g) => a + g.count, 0),
          })}
        </AppText>
        <AppText raw style={[styles.listSubHint, {color: colors.ink3}]}>
          {t('LP_WARMUP_LIST_HINT')}
        </AppText>
      </View>

      <ScrollView style={styles.listScroll} contentContainerStyle={styles.listScrollContent}>
        {groups.map(group => {
          const meta = GROUP_META[group.type];
          return (
            <View key={group.type} style={styles.groupBlock}>
              <View style={styles.groupHead}>
                <AppText raw style={[styles.groupEmoji, {color: colors.ink}]}>
                  {meta.emoji}
                </AppText>
                <AppText raw style={[styles.groupLabel, {color: colors.ink3}]}>
                  {t(meta.labelKey)}
                </AppText>
                <View style={[styles.groupBadge, {backgroundColor: colors.flowSoft}]}>
                  <AppText raw style={[styles.groupBadgeText, {color: colors.flowInk}]}>
                    {group.items.length}
                  </AppText>
                </View>
              </View>

              <View
                style={[styles.groupCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
                {group.items.map((it, i) => (
                  <View
                    key={it.id}
                    style={[
                      styles.row,
                      i > 0 && {borderTopWidth: 1, borderTopColor: colors.hair},
                    ]}>
                    <View style={styles.rowWord}>
                      {group.type === 'grammarPoint' ? (
                        <View style={[styles.grammarChip, {backgroundColor: colors.flowSoft}]}>
                          <AppText raw style={[styles.grammarChipText, {color: colors.flowInk}]}>
                            {it.headword}
                          </AppText>
                        </View>
                      ) : (
                        <AppText
                          raw
                          style={[
                            styles.rowHeadword,
                            {
                              color: group.type === 'chunk' ? colors.flowInk : colors.ink,
                              fontFamily:
                                group.type === 'chunk'
                                  ? InflowFonts.reading.bold
                                  : InflowFonts.reading.medium,
                            },
                          ]}>
                          {it.headword}
                        </AppText>
                      )}
                      {it.ipa && group.type !== 'grammarPoint' ? (
                        <AppText raw style={[styles.rowIpa, {color: colors.ink3}]}>
                          {it.ipa}
                        </AppText>
                      ) : null}
                      {group.type === 'grammarPoint' && it.pattern ? (
                        <AppText raw style={[styles.rowFormula, {color: colors.ink2}]}>
                          {it.pattern}
                        </AppText>
                      ) : null}
                    </View>
                    {group.type !== 'grammarPoint' ? (
                      <>
                        <AppText raw style={[styles.rowVi, {color: colors.warmInk}]} numberOfLines={1}>
                          {it.meaning}
                        </AppText>
                        <View style={[styles.spkSmall, {backgroundColor: colors.flowSoft}]}>
                          <Icon name="Volume2" className="text-flow-ink w-3.5 h-3.5" />
                        </View>
                      </>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {fontFamily: InflowFonts.ui.regular, fontSize: 15},
  headerTitle: {flex: 1, alignItems: 'center'},
  headerTitleText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  viewTog: {flexDirection: 'row', gap: 2, padding: 3, borderRadius: 10},
  togBtn: {width: 30, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},

  // --- Deck view ---
  deckBody: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
  kicker: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  deck: {width: '100%', alignItems: 'center', marginTop: 22, marginBottom: 20},
  backCard: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 20,
  },
  backCard1: {top: 4, width: 266, height: 306, opacity: 0.8},
  backCard2: {top: 8, width: 242, height: 300, opacity: 0.5},
  card: {
    width: 302,
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#16263E',
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 18},
    elevation: 10,
  },
  kindPill: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 16,
  },
  kindPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11},
  word: {fontFamily: InflowFonts.reading.medium, fontSize: 30, letterSpacing: -0.4},
  ipaRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8},
  ipa: {fontFamily: InflowFonts.reading.italic, fontStyle: 'italic', fontSize: 15},
  spk: {width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  meaning: {fontFamily: InflowFonts.ui.extrabold, fontSize: 23, marginTop: 16},
  pattern: {fontFamily: InflowFonts.ui.regular, fontSize: 13, marginTop: 6},
  divider: {height: 1, marginTop: 16},
  example: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 14,
  },
  dots: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8},
  dot: {height: 8, width: 8, borderRadius: 4},

  // --- List view ---
  listBody: {flex: 1},
  listSub: {flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingBottom: 12},
  listSubCount: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11, letterSpacing: 0.6},
  listSubHint: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
  listScroll: {flex: 1},
  listScrollContent: {paddingHorizontal: 20, paddingBottom: 12},
  groupBlock: {marginBottom: 18},
  groupHead: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8},
  groupEmoji: {fontFamily: InflowFonts.ui.regular, fontSize: 14},
  groupLabel: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  groupBadge: {borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1},
  groupBadgeText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 10.5},
  groupCard: {borderWidth: 1, borderRadius: 13, overflow: 'hidden'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 13},
  rowWord: {flexShrink: 1},
  rowHeadword: {fontSize: 15.5},
  rowIpa: {fontFamily: InflowFonts.reading.italic, fontStyle: 'italic', fontSize: 10.5},
  rowFormula: {fontFamily: InflowFonts.reading.regular, fontSize: 13.5, marginTop: 2},
  grammarChip: {alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2},
  grammarChipText: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  rowVi: {flex: 1, fontFamily: InflowFonts.ui.semibold, fontSize: 12.5, textAlign: 'right'},
  spkSmall: {width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},

  // --- Footer ---
  footer: {paddingTop: 12, paddingHorizontal: 22, gap: 10},
  cta: {alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  ghost: {alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
  ghostText: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5},
});

LessonWarmupPlayer.displayName = 'LessonWarmupPlayer';
