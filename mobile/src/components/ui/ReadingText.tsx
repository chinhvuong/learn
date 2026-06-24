import React from 'react';
import {Text, TextProps, TextStyle} from 'react-native';
import {useColors} from '@/hooks/useColors';
import {useAppSelector} from '@/store/hooks';
import {InflowFonts, inflowTextStyles} from '@/config/typography';

export interface ReadingTextProps extends TextProps {
  /** Larger reading size for prominent passages. */
  size?: 'default' | 'large';
  children: React.ReactNode;
}

/**
 * The reading surface for a Lesson's Bilingual Passage — the Target-Language
 * text that reads like an article.
 *
 * Uses the Newsreader serif when the learner's `readingSerif` setting is on
 * (the handoff default); falls back to the UI sans (Be Vietnam Pro) when off.
 * Compose `ItemToken` children inside it to encode Vocabulary / Chunk /
 * Grammar Point / Absorbed Items inline.
 */
export default function ReadingText({
  size = 'default',
  children,
  style,
  ...props
}: ReadingTextProps) {
  const colors = useColors();
  const readingSerif = useAppSelector(state => state.app.readingSerif);

  const base = size === 'large' ? inflowTextStyles.readingLarge : inflowTextStyles.reading;
  const fontFamily = readingSerif ? base.fontFamily : InflowFonts.ui.regular;

  const composed: TextStyle = {
    ...base,
    fontFamily,
    color: colors.ink,
  };

  return (
    <Text {...props} style={[composed, style]}>
      {children}
    </Text>
  );
}

ReadingText.displayName = 'ReadingText';
