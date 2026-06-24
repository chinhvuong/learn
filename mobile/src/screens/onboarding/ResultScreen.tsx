import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §5 — Kết quả + Daily Goal. North Star jump + set Daily Goal
 * (docs/design/screens.md §5). Placeholder for now.
 */
const ResultScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_RESULT_TITLE'}
      subtitleKey={'ONBOARDING_RESULT_SUBTITLE'}
      icon={'PartyPopper'}
      ctaKey={'CONTINUE'}
      onNext={() => navigation.navigate('Onboarding', {screen: 'SignUp'})}
    />
  );
};

export default ResultScreen;
