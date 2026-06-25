import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Search} from 'lucide-react-native';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {FEATURED_SERIES, LOCKED_SERIES, type Series} from '../seriesData';

export interface SeriesBrowseViewProps {
  /** Open a Series' Detail (Browse → Detail navigation). */
  onOpenSeries: (series: Series) => void;
}

/** Diagonal "streak" stripes behind a featured-card / banner thumbnail. */
function Stripes({color, opacity}: {color: string; opacity: number}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[-30, 4, 38, 72, 106, 140, 174].map((x, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: -20,
            width: 12,
            height: 140,
            opacity,
            backgroundColor: color,
            transform: [{rotate: '-25deg'}],
          }}
        />
      ))}
    </View>
  );
}

/**
 * 17a Series — Browse (`rl7cV`; screens.md §05). The curated **Series** discovery
 * surface: a search header, Level / topic filter chips, the open Starter Series
 * under "★ Dành cho bạn" (teal-thumb featured cards), and the locked topic rows
 * ("Tất cả Series", each 🔒 behind the Paid Plan).
 *
 * Tokens only — teal `--flow` for the open featured thumbnail / progress, amber
 * `--warm` for the "Starter · mở" badge and the featured label.
 */
export default function SeriesBrowseView({onOpenSeries}: SeriesBrowseViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const renderFeatured = (series: Series) => {
    const open = series.started || series.featured;
    return (
      <Pressable
        key={series.id}
        accessibilityRole="button"
        accessibilityLabel={series.topic}
        onPress={() => onOpenSeries(series)}
        style={[styles.featCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
        <View
          style={[
            styles.featThumb,
            {backgroundColor: series.started ? colors.flow : colors.surface2},
          ]}>
          <Stripes
            color={series.started ? colors.flowPress : colors.border}
            opacity={0.5}
          />
          <AppText
            raw
            style={[styles.featEmoji, {color: series.started ? colors.onFlow : colors.ink}]}>
            {series.emoji}
          </AppText>
        </View>
        <View style={styles.featBody}>
          <AppText raw style={[styles.featTitle, {color: colors.ink}]}>
            {series.topic}
          </AppText>
          <AppText
            raw
            style={[styles.featMeta, {color: series.started ? colors.flowInk : colors.ink3}]}>
            {series.started
              ? t('SERIES_CARD_PROGRESS', {band: series.band, done: series.done, total: series.total})
              : t('SERIES_CARD_NEW', {band: series.band})}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.appBg}}>
      <ScrollView
        style={{backgroundColor: colors.appBg}}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 24,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Header: title + search chip */}
        <View style={styles.header}>
          <AppText raw style={[styles.title, {color: colors.ink}]}>
            {t('SERIES_BROWSE_TITLE')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('SERIES_BROWSE_SEARCH')}
            hitSlop={8}
            style={[styles.searchChip, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <Search size={18} color={colors.ink2} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Filter chips */}
        <View style={styles.filters}>
          <View style={[styles.chip, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <AppText raw style={[styles.chipText, {color: colors.ink2}]}>
              {t('SERIES_FILTER_LEVEL', {band: 'B1'})}
            </AppText>
          </View>
          <View style={[styles.chip, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <AppText raw style={[styles.chipText, {color: colors.ink2}]}>
              {t('SERIES_FILTER_TOPIC')}
            </AppText>
          </View>
        </View>

        {/* Featured label + Starter badge */}
        <View style={styles.featLabelRow}>
          <AppText raw style={[styles.featLabel, {color: colors.warmInk}]}>
            {t('SERIES_FEATURED_LABEL')}
          </AppText>
          <View style={[styles.starterBadge, {backgroundColor: colors.warmSoft}]}>
            <AppText raw style={[styles.starterBadgeText, {color: colors.warmInk}]}>
              {t('SERIES_FEATURED_BADGE')}
            </AppText>
          </View>
        </View>

        {/* Featured cards (open Starter) */}
        <View style={styles.featRow}>{FEATURED_SERIES.map(renderFeatured)}</View>

        {/* All Series heading + locked rows */}
        <AppText raw style={[styles.allHeading, {color: colors.ink}]}>
          {t('SERIES_ALL_HEADING')}
        </AppText>
        <View style={styles.lockedRows}>
          {LOCKED_SERIES.map(series => (
            <Pressable
              key={series.id}
              accessibilityRole="button"
              accessibilityLabel={series.topic}
              onPress={() => onOpenSeries(series)}
              style={[styles.lockedRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
              <View style={styles.lockedLeft}>
                <AppText raw style={[styles.lockedEmoji, {color: colors.ink2}]}>
                  {series.emoji}
                </AppText>
                <AppText raw style={[styles.lockedTopic, {color: colors.ink2}]}>
                  {series.topic}
                </AppText>
              </View>
              <AppText raw style={[styles.lock, {color: colors.ink3}]}>
                🔒
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  title: {fontFamily: InflowFonts.ui.extrabold, fontSize: 23, letterSpacing: -0.6},
  searchChip: {borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', justifyContent: 'center'},
  filters: {flexDirection: 'row', gap: 10, marginBottom: 16},
  chip: {borderRadius: 999, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14},
  chipText: {fontFamily: InflowFonts.ui.semibold, fontSize: 13},
  featLabelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  featLabel: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  starterBadge: {borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10},
  starterBadgeText: {fontFamily: InflowFonts.ui.semibold, fontSize: 11},
  featRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  featCard: {flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  featThumb: {height: 84, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  featEmoji: {fontSize: 30},
  featBody: {padding: 12, gap: 3},
  featTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  featMeta: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
  allHeading: {fontFamily: InflowFonts.ui.bold, fontSize: 17, marginBottom: 10},
  lockedRows: {gap: 10},
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  lockedLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  lockedEmoji: {fontSize: 16},
  lockedTopic: {fontFamily: InflowFonts.ui.semibold, fontSize: 14},
  lock: {fontSize: 16},
});

SeriesBrowseView.displayName = 'SeriesBrowseView';
