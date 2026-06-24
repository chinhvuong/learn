import React from "react";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {OnboardingStackParamList} from "./types";
import WelcomeScreen from "@/screens/onboarding/WelcomeScreen.tsx";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Onboarding stack (issue #4 placeholder).
 *
 * Hosts the pre-signup flow — Welcome → Topics → Reading Level → Golden First
 * Lesson → Result + Daily Goal → Sign up → Push priming (screens.md
 * "ONBOARDING"). Only Welcome exists for now; the rest land here later.
 */
export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen}/>
    </Stack.Navigator>
  );
}
