import React from 'react';
import {View} from 'react-native';
import PlaceholderScreen from '@/screens/PlaceholderScreen.tsx';
import {AppButton} from '@/components/ui';
import {useNavigation} from '@react-navigation/native';

/**
 * Hồ sơ (Profile / Stats) tab — North Star, Levels, Streak, Milestones, My
 * Collection (docs/design/screens.md §14). Placeholder for now; exposes a door
 * into Settings, which already exists in the boilerplate root stack.
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className={'flex-1 bg-background'}>
      <PlaceholderScreen
        titleKey={'TAB_PROFILE'}
        subtitleKey={'PROFILE_PLACEHOLDER_DESC'}
        icon={'User'}
      />
      <View className={'px-8 pb-safe-offset-8'}>
        <AppButton
          variant={'outline'}
          className={'rounded-full'}
          onPress={() => navigation.navigate('Settings')}
        >
          SETTINGS
        </AppButton>
      </View>
    </View>
  );
};

export default ProfileScreen;
