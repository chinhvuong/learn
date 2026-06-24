import React from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {RootStackScreenProps} from '@/navigation/types';
import {QuickReviewView} from '@/features/gamification';

type Props = RootStackScreenProps<'QuickReview'>;

/**
 * Hosts the optional **60-second quick review** (light SRS; CONTEXT.md → "SRS",
 * screens.md §10b). Opened from the Lesson-complete exits — always opt-in,
 * never a due-queue, no red debt badge. The screen is thin: it renders the
 * review feature view over the selected prompts and pops back when done.
 */
export default function QuickReviewScreen({route}: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {prompts} = route.params;

  return (
    <View style={{flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom}}>
      <QuickReviewView prompts={prompts} onDone={() => navigation.goBack()} />
    </View>
  );
}
