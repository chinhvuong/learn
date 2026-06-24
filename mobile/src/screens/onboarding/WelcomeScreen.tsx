import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon} from '@/components/ui';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §1 — Welcome. One-line promise + entry into the flow
 * (docs/design/screens.md §1). Placeholder; advances through the onboarding
 * stack and into the tab shell.
 */
const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  return (
    <View className={'flex-1 bg-background items-center justify-center px-8'}>
      <View className={'w-24 h-24 rounded-full bg-flowSoft items-center justify-center mb-8'}>
        <Icon name={'Sparkles'} className={'w-10 h-10 text-primary'}/>
      </View>
      <AppText variant={'heading1'} align={'center'}>
        ONBOARDING_WELCOME_TITLE
      </AppText>
      <AppText variant={'body'} color={'muted'} align={'center'} className={'mt-3'}>
        ONBOARDING_WELCOME_SUBTITLE
      </AppText>
      <View className={'mt-10 w-full gap-3'}>
        <AppButton
          variant={'primary'}
          className={'rounded-full'}
          onPress={() => navigation.navigate('Onboarding', {screen: 'Topics'})}
        >
          {t('ONBOARDING_START')}
        </AppButton>
        <AppButton
          variant={'ghost'}
          className={'rounded-full'}
          onPress={() => navigation.navigate('Main', {screen: 'LEARN'})}
        >
          {t('ONBOARDING_SKIP_TO_HOME')}
        </AppButton>
      </View>
    </View>
  );
};

export default WelcomeScreen;
