import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  cycleThemePreference,
  setLanguage,
  setReadingSerif,
  setShowAnnotations,
  type ThemePreference,
} from '@/store/slices/appSlice';
import {LANGUAGES} from '@/config/i18n';
import {useTranslation} from "react-i18next";
import {AppText, Select, Switch} from "@/components/ui";

const themePreferenceLabel: Record<ThemePreference, string> = {
  light: 'THEME_LIGHT',
  dark: 'THEME_DARK',
  system: 'THEME_SYSTEM',
};

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const {themePreference, language, showAnnotations, readingSerif} = useAppSelector(
    state => state.app,
  );
  const {t} = useTranslation();

  const handleCycleTheme = () => {
    dispatch(cycleThemePreference());
  };

  return (
    <View className='flex-1'>
      <View className="p-4">
        <View className='mb-4'>
          <AppText className="section-title" variant={'heading1'}>
            APPEARANCE
          </AppText>
        </View>

        {/* Theme: light / dark / system (cycles on tap) */}
        <TouchableOpacity
          className="flex-row justify-between items-center py-4 px-4 bg-neutrals800 rounded-lg mb-2"
          onPress={handleCycleTheme}
        >
          <Text className="text-foreground text-base font-sans-semibold">{t('THEME')}</Text>
          <Text className="text-neutrals300 text-sm font-sans-regular">
            {t(themePreferenceLabel[themePreference])}
          </Text>
        </TouchableOpacity>

        {/* showAnnotations — Item-type encoding in reading text */}
        <View className="flex-row justify-between items-center py-4 px-4 bg-neutrals800 rounded-lg mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-foreground text-base font-sans-semibold">
              {t('SHOW_ANNOTATIONS')}
            </Text>
            <Text className="text-neutrals300 text-sm font-sans-regular">
              {t('SHOW_ANNOTATIONS_DESC')}
            </Text>
          </View>
          <Switch
            value={showAnnotations}
            onValueChange={v => dispatch(setShowAnnotations(v))}
          />
        </View>

        {/* readingSerif — Newsreader serif on the reading surface */}
        <View className="flex-row justify-between items-center py-4 px-4 bg-neutrals800 rounded-lg mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-foreground text-base font-sans-semibold">
              {t('READING_SERIF')}
            </Text>
            <Text className="text-neutrals300 text-sm font-sans-regular">
              {t('READING_SERIF_DESC')}
            </Text>
          </View>
          <Switch value={readingSerif} onValueChange={v => dispatch(setReadingSerif(v))} />
        </View>

        <Select
          label={'Select language'}
          labelClassName={'hidden'}
          options={Object.values(LANGUAGES).map(lang => ({
            label: lang.nativeName,
            value: lang.code,
          }))}
          value={language}
          onValueChange={(value: any) => {
            dispatch(setLanguage(value))
          }}
          renderSelector={<TouchableOpacity
            className="flex-row justify-between items-center py-4 px-4 bg-neutrals800 rounded-lg mb-2"
          >
            <Text className="text-foreground text-base font-sans-semibold">{t('LANGUAGE')}</Text>
            <Text className="text-neutrals300 text-sm font-sans-regular">
              {LANGUAGES[language].nativeName}
            </Text>
          </TouchableOpacity>}
        />
      </View>
    </View>
  );
};
