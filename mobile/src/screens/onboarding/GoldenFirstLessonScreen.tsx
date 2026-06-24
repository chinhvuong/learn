import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §4 — Golden First Lesson, the aha moment before signup
 * (docs/design/screens.md §4). This step IS the reading Lesson Player; the
 * placeholder here just advances the flow.
 */
const GoldenFirstLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_GOLDEN_TITLE'}
      subtitleKey={'ONBOARDING_GOLDEN_SUBTITLE'}
      icon={'BookOpen'}
      ctaKey={'CONTINUE'}
      onNext={() => navigation.navigate('Onboarding', {screen: 'Result'})}
    />
  );
};

export default GoldenFirstLessonScreen;
