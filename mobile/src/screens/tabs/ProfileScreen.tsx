import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {ProfileView} from '@/features/gamification';
import type {Milestone} from '@/features/gamification';
import {RootStackScreenProps} from '@/navigation/types';

type Nav = RootStackScreenProps<'Main'>['navigation'];

/**
 * Hồ sơ (Profile) tab — the trophy case first (screens.md §14). The tab screen
 * is thin: it renders the Profile feature view and owns routing. Tapping a
 * trophy opens the full-screen Celebration (the share entry); "Kho của tôi" and
 * Settings are stubbed handoffs to their owning surfaces.
 */
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();

  const openCelebration = (milestone: Milestone) => {
    navigation.navigate('Celebration', {milestone});
  };

  return (
    <ProfileView
      onShareMilestone={openCelebration}
      onOpenSettings={() => navigation.navigate('Settings')}
    />
  );
}
