import React from 'react';
import {View} from 'react-native';
import {AppText, Icon} from '@/components/ui';

interface PlaceholderScreenProps {
  /** i18n key for the screen's title (e.g. a tab name). */
  titleKey: string;
  /** i18n key for a short supporting line. */
  subtitleKey?: string;
  /** lucide-react-native icon name. */
  icon?: string;
}

/**
 * A themed placeholder for screens whose real UI lands in a later issue.
 * Reads its colors from the design-token theme layer (no hardcoded colors) so
 * it respects light/dark automatically.
 */
const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
                                                               titleKey,
                                                               subtitleKey,
                                                               icon = 'Sparkles',
                                                             }) => {
  return (
    <View className={'flex-1 bg-background items-center justify-center px-8'}>
      <View
        className={'w-24 h-24 rounded-full bg-flowSoft items-center justify-center mb-6'}
      >
        <Icon name={icon as any} className={'w-10 h-10 text-primary'}/>
      </View>
      <AppText variant={'heading1'} align={'center'}>
        {titleKey}
      </AppText>
      {subtitleKey ? (
        <AppText variant={'body'} color={'muted'} align={'center'} className={'mt-2'}>
          {subtitleKey}
        </AppText>
      ) : null}
      <View className={'mt-6 px-4 py-2 rounded-full bg-surface'}>
        <AppText variant={'labelSmall'} color={'muted'}>
          PLACEHOLDER_SOON
        </AppText>
      </View>
    </View>
  );
};

export default PlaceholderScreen;
