import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {ProfileView} from '@/features/gamification';
import type {Milestone} from '@/features/gamification';
import {useAppSelector} from '@/store/hooks';
import {RootStackScreenProps} from '@/navigation/types';

type Nav = RootStackScreenProps<'Main'>['navigation'];

/**
 * Hồ sơ (Profile) tab — the trophy case first (screens.md §05/§14). The tab
 * screen is thin: it renders the Profile feature view and owns routing. Tapping
 * a trophy opens the full-screen Celebration (the share entry); the Streak tile
 * opens the Daily Goal moment; "Thư viện của tôi" / "Kho của tôi" hand off to My
 * Library; Settings is the top-right gear.
 */
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const streak = useAppSelector(state => state.home.streak);

  const openCelebration = (milestone: Milestone) => {
    navigation.navigate('Celebration', {milestone});
  };

  return (
    <ProfileView
      onShareMilestone={openCelebration}
      onOpenLibrary={() => navigation.navigate('MyLibrary')}
      onOpenCollection={() => navigation.navigate('MyLibrary')}
      onOpenDailyGoal={() => navigation.navigate('DailyGoal', {streak})}
      onOpenSettings={() => navigation.navigate('Settings')}
    />
  );
}
