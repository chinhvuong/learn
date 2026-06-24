import React from 'react';
import OnboardingStep from '@/screens/onboarding/OnboardingStep.tsx';
import {useNavigation} from '@react-navigation/native';

/**
 * Onboarding §6 — Đăng ký (delayed signup). Capture the account after the aha
 * (docs/design/screens.md §6). Placeholder for now.
 */
const SignUpScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <OnboardingStep
      titleKey={'ONBOARDING_SIGNUP_TITLE'}
      subtitleKey={'ONBOARDING_SIGNUP_SUBTITLE'}
      icon={'UserPlus'}
      ctaKey={'CONTINUE'}
      onNext={() => navigation.navigate('Onboarding', {screen: 'PushPriming'})}
    />
  );
};

export default SignUpScreen;
