import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §3 — Level Đọc (self-select Reading Level)
 * (docs/design/screens.md §3). Placeholder for now.
 */
const ReadingLevelScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_READING_LEVEL_TITLE'}
      subtitleKey={'ONBOARDING_READING_LEVEL_SUBTITLE'}
      icon={'Gauge'}
      ctaKey={'CONTINUE'}
      onNext={() => navigation.navigate('Onboarding', {screen: 'GoldenFirstLesson'})}
    />
  );
};

export default ReadingLevelScreen;
