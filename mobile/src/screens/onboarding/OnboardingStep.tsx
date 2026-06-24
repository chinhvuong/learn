import React from 'react';
import {View} from 'react-native';
import {AppButton, AppText, Icon} from '@/components/ui';

interface OnboardingStepProps {
  titleKey: string;
  subtitleKey?: string;
  icon?: string;
  /** i18n key for the primary CTA label. */
  ctaKey: string;
  onNext: () => void;
}

/**
 * A themed placeholder for a single onboarding step. Reads colors from the
 * design-token theme layer, so it respects light/dark. Real per-step UI
 * (topic chips, Level radios, etc.) lands in later issues.
 */
const OnboardingStep: React.FC<OnboardingStepProps> = ({
                                                         titleKey,
                                                         subtitleKey,
                                                         icon = 'Sparkles',
                                                         ctaKey,
                                                         onNext,
                                                       }) => (
  <View className={'flex-1 bg-background px-8 pt-safe-offset-12 pb-safe-offset-8'}>
    <View className={'flex-1 items-center justify-center'}>
      <View className={'w-20 h-20 rounded-full bg-flowSoft items-center justify-center mb-6'}>
        <Icon name={icon as any} className={'w-9 h-9 text-primary'}/>
      </View>
      <AppText variant={'heading1'} align={'center'}>
        {titleKey}
      </AppText>
      {subtitleKey ? (
        <AppText variant={'body'} color={'muted'} align={'center'} className={'mt-2'}>
          {subtitleKey}
        </AppText>
      ) : null}
    </View>
    <AppButton variant={'primary'} className={'rounded-full'} onPress={onNext}>
      {ctaKey}
    </AppButton>
  </View>
);

export default OnboardingStep;
