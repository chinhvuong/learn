import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §2 — Chọn chủ đề (Topics). Seeds the Interest Profile
 * (docs/design/screens.md §2). Placeholder for now.
 */
const TopicsScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_TOPICS_TITLE'}
      subtitleKey={'ONBOARDING_TOPICS_SUBTITLE'}
      icon={'Tags'}
      ctaKey={'CONTINUE'}
      onNext={() => navigation.navigate('Onboarding', {screen: 'ReadingLevel'})}
    />
  );
};

export default TopicsScreen;
