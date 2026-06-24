import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useColors} from '@/hooks/useColors';
import {useTheme} from '@/hooks/useTheme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  cycleThemePreference,
  setReadingSerif,
  setShowAnnotations,
  type ThemePreference,
} from '@/store/slices/appSlice';
import {AppColors, AppColorsLight} from '@/config/colors';
import {inflowTextStyles, InflowFonts} from '@/config/typography';
import {ItemToken, ReadingText, Switch} from '@/components/ui';

const themeLabelKey: Record<ThemePreference, string> = {
  light: 'THEME_LIGHT',
  dark: 'THEME_DARK',
  system: 'THEME_SYSTEM',
};

/** Section heading on the design-system surface. */
const SectionTitle: React.FC<{children: string}> = ({children}) => {
  const colors = useColors();
  return (
    <Text style={[inflowTextStyles.micro, {color: colors.ink3, marginBottom: 12}]}>
      {children}
    </Text>
  );
};

const Card: React.FC<{children: React.ReactNode}> = ({children}) => {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.hair,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}>
      {children}
    </View>
  );
};

/** A single token-color swatch with its name. */
const Swatch: React.FC<{name: string; color: string; onColor?: string}> = ({
  name,
  color,
  onColor,
}) => (
  <View style={{width: '33.33%', paddingRight: 8, marginBottom: 10}}>
    <View
      style={{
        height: 48,
        borderRadius: 10,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {onColor ? (
        <Text style={{color: onColor, fontFamily: InflowFonts.ui.bold, fontSize: 11}}>Aa</Text>
      ) : null}
    </View>
    <Text
      style={{
        fontFamily: InflowFonts.ui.medium,
        fontSize: 11,
        marginTop: 4,
        color: onColor ? undefined : undefined,
      }}
      numberOfLines={1}>
      {name}
    </Text>
  </View>
);

const DesignSystemScreen: React.FC = () => {
  const {t} = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const {preference, theme} = useTheme();
  const showAnnotations = useAppSelector(s => s.app.showAnnotations);
  const readingSerif = useAppSelector(s => s.app.readingSerif);

  // Local Absorbed state for the encoding demo (teal → amber on tap).
  const [absorbed, setAbsorbed] = useState<Record<string, boolean>>({});
  const toggleAbsorbed = (id: string) =>
    setAbsorbed(prev => ({...prev, [id]: !prev[id]}));

  const palette = theme === 'light' ? AppColorsLight : AppColors;

  // The token families that matter most, in legend order.
  const swatches: {name: string; color: string; onColor?: string}[] = [
    {name: 'flow', color: palette.flow, onColor: palette.onFlow},
    {name: 'flow-soft', color: palette.flowSoft},
    {name: 'flow-ink', color: palette.flowInk, onColor: palette.surface},
    {name: 'warm', color: palette.warm, onColor: palette.onFlow},
    {name: 'warm-soft', color: palette.warmSoft},
    {name: 'warm-ink', color: palette.warmInk, onColor: palette.surface},
    {name: 'ink', color: palette.ink, onColor: palette.surface},
    {name: 'ink-2', color: palette.ink2, onColor: palette.surface},
    {name: 'ink-3', color: palette.ink3, onColor: palette.surface},
    {name: 'surface', color: palette.surface},
    {name: 'surface-2', color: palette.surface2},
    {name: 'border', color: palette.border},
  ];

  return (
    <ScrollView style={{flex: 1, backgroundColor: colors.bg}}>
      <View style={{padding: 16}}>
        {/* Header + live light/dark toggle */}
        <Text style={[inflowTextStyles.h1, {color: colors.ink, marginBottom: 4}]}>
          {t('DESIGN_SYSTEM')}
        </Text>
        <Text style={[inflowTextStyles.caption, {color: colors.ink2, marginBottom: 16}]}>
          {t('DESIGN_SYSTEM_DESC')}
        </Text>

        <Pressable
          onPress={() => dispatch(cycleThemePreference())}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderColor: colors.flow,
            borderWidth: 1.5,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 20,
          }}>
          <Text style={[inflowTextStyles.body, {color: colors.ink, fontFamily: InflowFonts.ui.semibold}]}>
            {t('THEME')}
          </Text>
          <Text style={[inflowTextStyles.body, {color: colors.flowInk, fontFamily: InflowFonts.ui.bold}]}>
            {t(themeLabelKey[preference])}
          </Text>
        </Pressable>

        {/* Palette */}
        <SectionTitle>{t('DS_PALETTE')}</SectionTitle>
        <Card>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {swatches.map(s => (
              <Swatch key={s.name} name={s.name} color={s.color} onColor={s.onColor} />
            ))}
          </View>
        </Card>

        {/* Typography pairing */}
        <SectionTitle>{t('DS_TYPOGRAPHY')}</SectionTitle>
        <Card>
          <Text style={[inflowTextStyles.h2, {color: colors.ink}]}>Be Vietnam Pro</Text>
          <Text style={[inflowTextStyles.caption, {color: colors.ink3, marginTop: 4}]}>
            Giao diện · tiêu đề · số liệu — hỗ trợ tiếng Việt đầy đủ
          </Text>
          <View style={{height: 1, backgroundColor: colors.hair, marginVertical: 14}} />
          <Text style={[inflowTextStyles.readingLarge, {color: colors.ink}]}>
            Newsreader serif
          </Text>
          <Text style={[inflowTextStyles.caption, {color: colors.ink3, marginTop: 4}]}>
            Bề mặt đọc tiếng Anh — như đọc một bài viết hay
          </Text>
        </Card>

        {/* Item encodings */}
        <SectionTitle>{t('DS_ITEM_ENCODINGS')}</SectionTitle>
        <Card>
          {/* Legend rows */}
          <View style={{gap: 12, marginBottom: 16}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ReadingText>
                <ItemToken kind="vocabulary">habits</ItemToken>
              </ReadingText>
              <Text style={[inflowTextStyles.caption, {color: colors.ink2, marginLeft: 12}]}>
                {t('DS_VOCABULARY')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ReadingText>
                <ItemToken kind="chunk">give up</ItemToken>
              </ReadingText>
              <Text style={[inflowTextStyles.caption, {color: colors.ink2, marginLeft: 12}]}>
                {t('DS_CHUNK')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ReadingText>
                <ItemToken kind="grammarPoint">if they tried, they'd improve</ItemToken>
              </ReadingText>
              <Text style={[inflowTextStyles.caption, {color: colors.ink2, marginLeft: 12}]}>
                {t('DS_GRAMMAR_POINT')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ReadingText>
                <ItemToken kind="vocabulary" absorbed>
                  adopt
                </ItemToken>
              </ReadingText>
              <Text style={[inflowTextStyles.caption, {color: colors.ink2, marginLeft: 12}]}>
                {t('DS_ABSORBED')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Interactive reading sample — tap an Item to absorb it (teal → amber) */}
        <SectionTitle>{t('DS_READING_SAMPLE')}</SectionTitle>
        <Card>
          <ReadingText size="large">
            Many companies{' '}
            <ItemToken kind="chunk" absorbed={!!absorbed.giveup} onPress={() => toggleAbsorbed('giveup')}>
              give up
            </ItemToken>{' '}
            old{' '}
            <ItemToken kind="vocabulary" absorbed={!!absorbed.habits} onPress={() => toggleAbsorbed('habits')}>
              habits
            </ItemToken>{' '}
            and{' '}
            <ItemToken kind="vocabulary" absorbed={!!absorbed.adopt} onPress={() => toggleAbsorbed('adopt')}>
              adopt
            </ItemToken>{' '}
            new tools —{' '}
            <ItemToken kind="grammarPoint" absorbed={!!absorbed.cond} onPress={() => toggleAbsorbed('cond')}>
              if they tried, they'd improve
            </ItemToken>
            .
          </ReadingText>
          <Text style={[inflowTextStyles.caption, {color: colors.ink3, marginTop: 12}]}>
            {t('DS_TAP_TO_ABSORB')}
          </Text>
        </Card>

        {/* The two handoff settings, live */}
        <SectionTitle>{t('APPEARANCE')}</SectionTitle>
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={[inflowTextStyles.body, {color: colors.ink, fontFamily: InflowFonts.ui.semibold}]}>
                {t('SHOW_ANNOTATIONS')}
              </Text>
              <Text style={[inflowTextStyles.caption, {color: colors.ink3}]}>
                {t('SHOW_ANNOTATIONS_DESC')}
              </Text>
            </View>
            <Switch
              value={showAnnotations}
              onValueChange={v => dispatch(setShowAnnotations(v))}
            />
          </View>
          <View
            style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={[inflowTextStyles.body, {color: colors.ink, fontFamily: InflowFonts.ui.semibold}]}>
                {t('READING_SERIF')}
              </Text>
              <Text style={[inflowTextStyles.caption, {color: colors.ink3}]}>
                {t('READING_SERIF_DESC')}
              </Text>
            </View>
            <Switch value={readingSerif} onValueChange={v => dispatch(setReadingSerif(v))} />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

export default DesignSystemScreen;
