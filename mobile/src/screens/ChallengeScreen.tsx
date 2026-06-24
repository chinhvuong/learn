import React from 'react';
import PlaceholderScreen from '@/screens/PlaceholderScreen.tsx';

/**
 * Thử thách (Challenge Feed) tab — Reels-style Reading Challenges
 * (docs/design/screens.md §16). Built after the core loop; placeholder for now.
 */
const ChallengeScreen: React.FC = () => (
  <PlaceholderScreen
    titleKey={'TAB_CHALLENGE'}
    subtitleKey={'CHALLENGE_PLACEHOLDER_DESC'}
    icon={'Zap'}
  />
);

export default ChallengeScreen;
