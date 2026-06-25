import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Animated, {Easing, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  closeCard,
  completeSession,
  selectNorthStarLive,
  startSession,
  tapItem,
} from '../lessonSessionSlice';
import type {Item, Lesson, ReadingPage, ReadingSpan} from '../types';
import NorthStarCounter from './NorthStarCounter';

export interface LessonReadingImmersionProps {
  lesson: Lesson;
  /** Paginated reading content. */
  pages: ReadingPage[];
  /** All Items addressable in the pages, by id (the tap targets). */
  itemsById: Record<string, Item>;
  /** Cumulative North Star before this Lesson (Absorbed-this-session adds on). */
  northStarBase: number;
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** "Tôi đã đọc xong" on the final page → complete the reading pass. */
  onCompleted: () => void;
}

/**
 * Lesson Player — **Reading immersion** ("Đắm chìm đọc", screens.md §10 LP3 ·
 * `ZVzfM` / LP3b · `edu17` / LP3c · `oyotO`). The Target-Language passage,
 * paginated like a book ("Trang N / M"), read in the Newsreader serif. Tapping
 * a teal Item is the **absorption gesture**: it pops the Item's meaning card AND
 * marks the Item **Absorbed**, recoloring the inline token teal (`--flow`) →
 * amber (`--warm`) and firing a +1 on the **North Star** (CONTEXT.md →
 * "absorption gesture" / "North Star"). The final page swaps the next-page
 * arrow for "Tôi đã đọc xong".
 */
export default function LessonReadingImmersion({
  lesson,
  pages,
  itemsById,
  northStarBase,
  onClose,
  onCompleted,
}: LessonReadingImmersionProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.lessonSession);

  const [page, setPage] = useState(0);
  const total = pages.length;
  const current = pages[Math.min(page, total - 1)];
  const isFirst = page === 0;
  const isLast = page >= total - 1;

  // Only the in-page Items gate completion (the absorption targets). Start a
  // fresh session whenever the Lesson changes.
  const projectedItemIds = useMemo(
    () =>
      pages.flatMap(p =>
        p.spans.filter(s => s.kind === 'item').map(s => (s as {itemId: string}).itemId),
      ),
    [pages],
  );
  useEffect(() => {
    dispatch(
      startSession({lessonId: lesson.id, projectedItemIds, northStarBase}),
    );
  }, [dispatch, lesson.id, projectedItemIds, northStarBase]);

  const sessionReady = session.lessonId === lesson.id;
  const northStarLive = sessionReady ? selectNorthStarLive(session) : northStarBase;
  const openItem = session.openCardItemId ? itemsById[session.openCardItemId] : null;

  const goPrev = () => {
    if (!isFirst) {
      dispatch(closeCard());
      setPage(p => Math.max(0, p - 1));
    }
  };
  const goNext = () => {
    if (!isLast) {
      dispatch(closeCard());
      setPage(p => Math.min(total - 1, p + 1));
    }
  };
  const finish = () => {
    dispatch(completeSession());
    onCompleted();
  };

  const progressPct = total === 0 ? 0 : ((page + 1) / total) * 100;

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg, paddingTop: insets.top}]}>
      {/* Header: close · title · Aa / North Star. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.headBtn, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.headGlyph, {color: colors.ink2}]}>
            ✕
          </AppText>
        </Pressable>
        <AppText raw style={[styles.headTitle, {color: colors.ink}]} numberOfLines={1}>
          {lesson.title}
        </AppText>
        <NorthStarCounter
          value={northStarLive}
          floatKey={session.absorbFloatKey}
          variant="pill"
        />
        <View style={[styles.headBtn, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.aaText, {color: colors.ink2}]}>
            Aa
          </AppText>
        </View>
      </View>

      {/* Reading progress hairline. */}
      <View style={[styles.pbarTrack, {backgroundColor: colors.surface2}]}>
        <View style={[styles.pbarFill, {width: `${progressPct}%`, backgroundColor: colors.flow}]} />
      </View>

      {/* The paginated article. */}
      <ScrollView style={styles.articleScroll} contentContainerStyle={styles.articleContent}>
        <ReadingPageView
          page={current}
          decided={session.decided}
          colors={colors}
          onTapItem={id => dispatch(tapItem({itemId: id}))}
        />
      </ScrollView>

      {/* Open Item meaning popup (the absorption gesture's reveal). */}
      {openItem ? (
        <View style={[styles.popupWrap, {bottom: 96 + insets.bottom}]} pointerEvents="box-none">
          <ReadingItemPopup
            item={openItem}
            colors={colors}
            t={t}
            onClose={() => dispatch(closeCard())}
          />
        </View>
      ) : null}

      {/* Footer pager — "Trang N / M" + prev/next, or the finish CTA on page M. */}
      <View
        style={[
          styles.footer,
          {borderTopColor: colors.hair, paddingBottom: 14 + insets.bottom},
        ]}>
        {isLast ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_READING_FINISH')}
            onPress={finish}
            style={[styles.finishBtn, {backgroundColor: colors.flow}]}>
            <AppText raw style={[styles.finishText, {color: colors.onFlow}]}>
              {t('LP_READING_FINISH')} →
            </AppText>
          </Pressable>
        ) : null}

        <View style={styles.pager}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_READING_PREV')}
            accessibilityState={{disabled: isFirst}}
            disabled={isFirst}
            onPress={goPrev}
            style={[styles.pagerBtn, {backgroundColor: colors.surface2, opacity: isFirst ? 0.45 : 1}]}>
            <AppText raw style={[styles.pagerGlyph, {color: colors.ink2}]}>
              ‹
            </AppText>
          </Pressable>

          <View style={styles.pagerInd}>
            <AppText raw style={[styles.pagerLabel, {color: colors.ink2}]}>
              {t('LP_READING_PAGE', {current: page + 1, total})}
            </AppText>
            <View style={styles.pagerDots}>
              {pages.map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    styles.pagerDot,
                    i === page
                      ? {backgroundColor: colors.flow, width: 18}
                      : {backgroundColor: colors.hair},
                  ]}
                />
              ))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_READING_NEXT')}
            accessibilityState={{disabled: isLast}}
            disabled={isLast}
            onPress={goNext}
            style={[
              styles.pagerBtn,
              isLast
                ? {backgroundColor: colors.surface2, opacity: 0.45}
                : {backgroundColor: colors.flow},
            ]}>
            <AppText raw style={[styles.pagerGlyph, {color: isLast ? colors.ink2 : colors.onFlow}]}>
              ›
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type Colors = ReturnType<typeof useColors>;
type TFn = ReturnType<typeof useTranslation>['t'];

/**
 * Render one Reading page as flowing inline text. Plain spans are Newsreader
 * body; Item spans render as inline tokens — teal (`--flow`) when unabsorbed,
 * recolored amber (`--warm`) once Absorbed. Grammar-Point spans render on a
 * teal-soft highlighted run (the design's grammar box). Paragraph markers
 * (`{kind:'text', text:''}`) insert a vertical gap.
 */
function ReadingPageView({
  page,
  decided,
  colors,
  onTapItem,
}: {
  page: ReadingPage;
  decided: Record<string, string>;
  colors: Colors;
  onTapItem: (id: string) => void;
}) {
  // Break the flat span list into paragraphs at empty text markers.
  const paragraphs = useMemo(() => {
    const out: ReadingSpan[][] = [[]];
    page.spans.forEach(span => {
      if (span.kind === 'text' && span.text === '') {
        out.push([]);
      } else {
        out[out.length - 1].push(span);
      }
    });
    return out;
  }, [page.spans]);

  return (
    <View>
      {paragraphs.map((spans, pi) => (
        <AppText
          raw
          key={pi}
          style={[styles.paragraph, {color: colors.ink}, pi > 0 && styles.paragraphGap]}>
          {spans.map((span, si) => {
            if (span.kind === 'text') {
              return (
                <AppText raw key={si} style={[styles.read, {color: colors.ink}]}>
                  {span.text}
                </AppText>
              );
            }
            const absorbed = decided[span.itemId] === 'absorbed';
            const tint = absorbed ? colors.warmInk : colors.flowInk;
            if (span.grammar) {
              // Grammar-Point run — teal-soft highlight box.
              return (
                <AppText
                  raw
                  key={si}
                  accessibilityRole="button"
                  onPress={() => onTapItem(span.itemId)}
                  style={[
                    styles.read,
                    styles.grammarRun,
                    {
                      color: colors.ink,
                      backgroundColor: absorbed ? colors.warmSoft : colors.flowSoft,
                    },
                  ]}>
                  {span.text}
                </AppText>
              );
            }
            return (
              <AppText
                raw
                key={si}
                accessibilityRole="button"
                accessibilityState={{selected: absorbed}}
                onPress={() => onTapItem(span.itemId)}
                style={[
                  styles.read,
                  styles.itemRun,
                  {color: tint},
                ]}>
                {span.text}
              </AppText>
            );
          })}
        </AppText>
      ))}
    </View>
  );
}

/**
 * The Item meaning popup (LP3b · `edu17` Popup) — a bottom card revealed by the
 * absorption gesture: headword + type chip + IPA/POS, the Native-Language
 * meaning, the usage pattern, and "🔊 Nghe" / "+ Lưu học" actions.
 */
function ReadingItemPopup({
  item,
  colors,
  t,
  onClose,
}: {
  item: Item;
  colors: Colors;
  t: TFn;
  onClose: () => void;
}) {
  const chipKey =
    item.type === 'chunk'
      ? 'LP_READING_CHIP_CHUNK'
      : item.type === 'grammarPoint'
        ? 'LP_READING_CHIP_GRAMMAR'
        : 'LP_READING_CHIP_VOCAB';
  return (
    <Animated.View
      entering={popupEntering}
      style={[styles.popup, {backgroundColor: colors.surface, borderColor: colors.border}]}>
      <View style={styles.popupHead}>
        <View style={styles.popupCol}>
          <View style={styles.popupWordRow}>
            <AppText raw style={[styles.popupWord, {color: colors.ink}]}>
              {item.headword}
            </AppText>
            <View style={[styles.popupChip, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.popupChipText, {color: colors.flowInk}]}>
                {t(chipKey)}
              </AppText>
            </View>
          </View>
          <AppText raw style={[styles.popupIpa, {color: colors.ink3}]}>
            {[item.ipa, item.posLabel].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.popupClose, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.popupCloseGlyph, {color: colors.ink3}]}>
            ✕
          </AppText>
        </Pressable>
      </View>

      <AppText raw style={[styles.popupVi, {color: colors.warmInk}]}>
        → {item.meaning}
      </AppText>

      {item.pattern ? (
        <AppText raw style={[styles.popupPattern, {color: colors.ink2}]}>
          ⚙ {item.pattern}
        </AppText>
      ) : null}

      <View style={styles.popupBtns}>
        <Pressable
          accessibilityRole="button"
          style={[styles.popupListen, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={[styles.popupListenText, {color: colors.ink}]}>
            🔊 {t('LP_LISTEN')}
          </AppText>
        </Pressable>
        <View style={[styles.popupSave, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.popupSaveText, {color: colors.warmInk}]}>
            + {t('LP_READING_SAVE')}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}

const popupEntering = () => {
  'worklet';
  const ease = Easing.bezier(0.2, 0.8, 0.3, 1);
  return {
    initialValues: {opacity: 0, transform: [{translateY: 16}, {scale: 0.96}]},
    animations: {
      opacity: withTiming(1, {duration: 240, easing: ease}),
      transform: [
        {translateY: withTiming(0, {duration: 240, easing: ease})},
        {scale: withTiming(1, {duration: 240, easing: ease})},
      ],
    },
  };
};

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingVertical: 10},
  headBtn: {width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  headGlyph: {fontFamily: InflowFonts.ui.regular, fontSize: 14},
  aaText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  headTitle: {flex: 1, fontFamily: InflowFonts.ui.bold, fontSize: 14},
  pbarTrack: {height: 3, overflow: 'hidden'},
  pbarFill: {height: 3},
  articleScroll: {flex: 1},
  articleContent: {paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16},
  paragraph: {fontFamily: InflowFonts.reading.regular, fontSize: 18, lineHeight: 29},
  paragraphGap: {marginTop: 11},
  read: {fontFamily: InflowFonts.reading.regular, fontSize: 18, lineHeight: 29},
  itemRun: {fontFamily: InflowFonts.reading.medium},
  grammarRun: {borderRadius: 4},
  popupWrap: {position: 'absolute', left: 14, right: 14},
  popup: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 17,
    shadowColor: '#16263E',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: 14},
    elevation: 14,
  },
  popupHead: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  popupCol: {flex: 1, gap: 2},
  popupWordRow: {flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap'},
  popupWord: {fontFamily: InflowFonts.reading.medium, fontSize: 21},
  popupChip: {borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3},
  popupChipText: {fontFamily: InflowFonts.ui.bold, fontSize: 10.5},
  popupIpa: {fontFamily: InflowFonts.reading.italic, fontStyle: 'italic', fontSize: 13.5},
  popupClose: {width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  popupCloseGlyph: {fontFamily: InflowFonts.ui.regular, fontSize: 14},
  popupVi: {fontFamily: InflowFonts.ui.bold, fontSize: 18, marginTop: 9},
  popupPattern: {fontFamily: InflowFonts.ui.regular, fontSize: 12.5, marginTop: 5},
  popupBtns: {flexDirection: 'row', gap: 9, marginTop: 12},
  popupListen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  popupListenText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  popupSave: {flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 11},
  popupSaveText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  footer: {borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 11, gap: 11},
  finishBtn: {alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingVertical: 15},
  finishText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  pager: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  pagerBtn: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  pagerGlyph: {fontFamily: InflowFonts.ui.bold, fontSize: 20, lineHeight: 22},
  pagerInd: {alignItems: 'center', gap: 6},
  pagerLabel: {fontFamily: InflowFonts.ui.bold, fontSize: 13},
  pagerDots: {flexDirection: 'row', alignItems: 'center', gap: 5},
  pagerDot: {height: 6, width: 6, borderRadius: 3},
});

LessonReadingImmersion.displayName = 'LessonReadingImmersion';
