import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import PlaceholderScreen from '@/screens/PlaceholderScreen.tsx';
import {AppButton} from '@/components/ui';
import {useNavigation} from '@react-navigation/native';

/**
 * Học (Home) tab — the root screen on every launch (docs/design/screens.md §8).
 * Placeholder for now; exposes a button into the modal Lesson Player so the
 * core-loop navigation is exercisable.
 */
const LearnScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  return (
    <View className={'flex-1 bg-background'}>
      <PlaceholderScreen
        titleKey={'TAB_LEARN'}
        subtitleKey={'LEARN_PLACEHOLDER_DESC'}
        icon={'GraduationCap'}
      />
      <View className={'px-8 pb-safe-offset-8 gap-3'}>
        <AppButton
          variant={'primary'}
          className={'rounded-full'}
          onPress={() => navigation.navigate('LessonPlayer', {screen: 'Player'})}
        >
          {t('OPEN_LESSON_PLAYER')}
        </AppButton>
        <AppButton
          variant={'outline'}
          className={'rounded-full'}
          onPress={() => navigation.navigate('Onboarding', {screen: 'Welcome'})}
        >
          {t('OPEN_ONBOARDING')}
        </AppButton>
      </View>
    </View>
  );
};

export default LearnScreen;
