import React from "react";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {OnboardingStackParamList} from "./types";
import WelcomeScreen from "@/screens/onboarding/WelcomeScreen.tsx";
import TopicsScreen from "@/screens/onboarding/TopicsScreen.tsx";
import ReadingLevelScreen from "@/screens/onboarding/ReadingLevelScreen.tsx";
import ResultScreen from "@/screens/onboarding/ResultScreen.tsx";
import SignupScreen from "@/screens/onboarding/SignupScreen.tsx";
import PushPrimingScreen from "@/screens/onboarding/PushPrimingScreen.tsx";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Onboarding stack — the value-before-signup first run (screens.md
 * "ONBOARDING", PRD stories 1–11):
 *
 *   Welcome → Topics → Reading Level → [Golden First Lesson on the root
 *   LessonPlayer] → Result + Daily Goal → Sign up → Push priming
 *
 * The Golden First Lesson runs on the root stack's modal LessonPlayer (so it
 * happens before any signup); Reading Level launches it and resumes the flow at
 * Result on return. Push priming hands off to the tab shell at the end.
 */
export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen}/>
      <Stack.Screen name="Topics" component={TopicsScreen}/>
      <Stack.Screen name="ReadingLevel" component={ReadingLevelScreen}/>
      <Stack.Screen name="Result" component={ResultScreen}/>
      <Stack.Screen name="Signup" component={SignupScreen}/>
      <Stack.Screen name="PushPriming" component={PushPrimingScreen}/>
    </Stack.Navigator>
  );
}
