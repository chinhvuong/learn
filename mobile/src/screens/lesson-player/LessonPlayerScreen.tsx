import React from 'react';
import {Pressable, View} from 'react-native';
import {AppText, Icon} from '@/components/ui';
import {useNavigation} from '@react-navigation/native';
import {LessonPlayerStackScreenProps} from '@/navigation/types.ts';

/**
 * Lesson Player — the modal study surface (Bilingual Passage / Listening
 * Replay, Item cards, consolidation, completion; docs/design/screens.md §9–11).
 * Presented as a modal stack over the tabs. Placeholder for now: a close
 * affordance + the Lesson id it was opened with.
 */
const LessonPlayerScreen: React.FC<LessonPlayerStackScreenProps<'Player'>> = ({
                                                                                route,
                                                                              }) => {
  const navigation = useNavigation();
  const lessonId = route.params?.lessonId;

  return (
    <View className={'flex-1 bg-background px-8 pt-safe-offset-6 pb-safe-offset-8'}>
      <View className={'flex-row justify-end'}>
        <Pressable
          accessibilityRole={'button'}
          className={'w-12 h-12 rounded-full bg-surface items-center justify-center'}
          onPress={() => navigation.goBack()}
        >
          <Icon name={'X'} className={'w-6 h-6 text-foreground'}/>
        </Pressable>
      </View>
      <View className={'flex-1 items-center justify-center'}>
        <View className={'w-24 h-24 rounded-full bg-flowSoft items-center justify-center mb-6'}>
          <Icon name={'BookOpenText'} className={'w-10 h-10 text-primary'}/>
        </View>
        <AppText variant={'heading1'} align={'center'}>
          LESSON_PLAYER_TITLE
        </AppText>
        <AppText variant={'body'} color={'muted'} align={'center'} className={'mt-2'}>
          LESSON_PLAYER_PLACEHOLDER_DESC
        </AppText>
        {lessonId ? (
          <View className={'mt-4 px-4 py-2 rounded-full bg-surface'}>
            <AppText variant={'labelSmall'} color={'muted'} raw>
              {`lessonId: ${lessonId}`}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default LessonPlayerScreen;
