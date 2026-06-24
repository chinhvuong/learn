import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §7 — Push priming (after signup). Explains the benefit before the
 * iOS system prompt (docs/design/screens.md §7). Final onboarding step; hands
 * off to the tab shell (Học).
 */
const PushPrimingScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_PUSH_TITLE'}
      subtitleKey={'ONBOARDING_PUSH_SUBTITLE'}
      icon={'Bell'}
      ctaKey={'ONBOARDING_PUSH_CTA'}
      onNext={() => navigation.navigate('Main', {screen: 'LEARN'})}
    />
  );
};

export default PushPrimingScreen;
