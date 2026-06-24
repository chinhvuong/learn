import React from 'react';
import {Share, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {RootStackScreenProps} from '@/navigation/types';
import {useAppSelector} from '@/store/hooks';
import {CelebrationView, LevelUpView, milestoneDisplay} from '@/features/gamification';

type Props = RootStackScreenProps<'Celebration'>;

/**
 * Hosts the full-screen major-milestone **Celebration** (screens.md §12) and the
 * **Level up** takeover (§14b) — chosen by the milestone kind passed on the
 * route. Both are reachable from the Lesson-complete flow and from tapping a
 * Profile trophy.
 *
 * Every exit here is guilt-free: continue, share, or "rest, see you tomorrow" —
 * all simply pop back. The share opens the system share sheet with text derived
 * from the milestone (the Milestone Card is the visual; the text carries the
 * app link for viral acquisition).
 */
export default function CelebrationScreen({route}: Props) {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {milestone} = route.params;
  const home = useAppSelector(state => state.home);

  const dismiss = () => navigation.goBack();

  const share = async () => {
    const display = milestoneDisplay(milestone);
    try {
      await Share.share({
        message: t('CELEBRATE_SHARE_MESSAGE', {
          title: display.title,
          northStar: home.northStar.toLocaleString('en-US'),
        }),
      });
    } catch {
      // Sharing is best-effort; a cancelled/failed share is a no-op.
    }
  };

  return (
    <View style={{flex: 1}}>
      {milestone.kind === 'levelUp' ? (
        <LevelUpView
          skill={milestone.skill}
          fromBand={milestone.fromBand}
          toBand={milestone.toBand}
          onSeeContent={dismiss}
          onLater={dismiss}
        />
      ) : (
        <CelebrationView
          milestone={milestone}
          handle={t('PROFILE_HANDLE')}
          northStar={home.northStar}
          onShare={share}
          onContinue={dismiss}
          onRest={dismiss}
        />
      )}
    </View>
  );
}
