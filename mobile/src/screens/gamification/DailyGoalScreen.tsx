import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {DailyGoalView} from '@/features/gamification';
import {RootStackScreenProps} from '@/navigation/types';

type Props = RootStackScreenProps<'DailyGoal'>;

/**
 * Hosts the 14c Mục tiêu ngày — Streak moment (§05; design node `j2fWf`). The
 * everyday Daily-Goal tier shown as a standalone Streak celebration. Every exit
 * is guilt-free — Continue keeps the momentum, "Xong cho hôm nay" simply pops
 * back (protecting sustainable habit over bingeing, CONTEXT.md → "Celebration
 * moment").
 */
export default function DailyGoalScreen({route}: Props) {
  const navigation = useNavigation();
  const {streak} = route.params;

  const dismiss = () => navigation.goBack();

  return <DailyGoalView streak={streak} onContinue={dismiss} onDone={dismiss} />;
}
