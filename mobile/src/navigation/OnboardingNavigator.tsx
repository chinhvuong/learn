import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from './types';
import WelcomeScreen from '@/screens/onboarding/WelcomeScreen.tsx';
import TopicsScreen from '@/screens/onboarding/TopicsScreen.tsx';
import ReadingLevelScreen from '@/screens/onboarding/ReadingLevelScreen.tsx';
import GoldenFirstLessonScreen from '@/screens/onboarding/GoldenFirstLessonScreen.tsx';
import ResultScreen from '@/screens/onboarding/ResultScreen.tsx';
import SignUpScreen from '@/screens/onboarding/SignUpScreen.tsx';
import PushPrimingScreen from '@/screens/onboarding/PushPrimingScreen.tsx';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Onboarding stack — Welcome → Topics → Reading Level → Golden First Lesson →
 * Result + Daily Goal → Sign up → Push priming (docs/design/screens.md §1–7).
 * Headerless: each onboarding step renders its own chrome.
 */
const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen}/>
      <Stack.Screen name="Topics" component={TopicsScreen}/>
      <Stack.Screen name="ReadingLevel" component={ReadingLevelScreen}/>
      <Stack.Screen name="GoldenFirstLesson" component={GoldenFirstLessonScreen}/>
      <Stack.Screen name="Result" component={ResultScreen}/>
      <Stack.Screen name="SignUp" component={SignUpScreen}/>
      <Stack.Screen name="PushPriming" component={PushPrimingScreen}/>
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
