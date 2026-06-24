import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LessonPlayerStackParamList} from './types';
import LessonPlayerScreen from '@/screens/lesson-player/LessonPlayerScreen.tsx';

const Stack = createNativeStackNavigator<LessonPlayerStackParamList>();

/**
 * Lesson Player stack — the modal study surface presented over the tabs
 * (docs/design/screens.md §9–11). Headerless: the player renders its own
 * close affordance. Further player sub-screens (cards, consolidation,
 * completion) attach here in later issues.
 */
const LessonPlayerNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Player" component={LessonPlayerScreen}/>
    </Stack.Navigator>
  );
};

export default LessonPlayerNavigator;
