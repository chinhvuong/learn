import React from "react";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {RootStackParamList} from "./types";
import {useAppSelector} from "@/store/hooks.ts";
import MainTabNavigator from "./MainTabNavigator";
import OnboardingStackNavigator from "./OnboardingStackNavigator";
import LessonPlayerScreen from "@/screens/lesson/LessonPlayerScreen.tsx";
import CelebrationScreen from "@/screens/gamification/CelebrationScreen.tsx";
import QuickReviewScreen from "@/screens/gamification/QuickReviewScreen.tsx";
import SettingsScreen from "@/screens/SettingsScreen";
import MyLibraryScreen from "@/screens/tabs/MyLibraryScreen.tsx";
import ComponentsDemo from "@/screens/ComponentsDemo";
import DesignSystemScreen from "@/screens/DesignSystemScreen";
import CustomScreenHeader from "@/navigation/components/ScreenHeader.tsx";
import AppButtonDemoScreen from "@/screens/demos/AppButtonDemoScreen";
import AvatarDemoScreen from "@/screens/demos/AvatarDemoScreen";
import BadgeDemoScreen from "@/screens/demos/BadgeDemoScreen";
import ChipDemoScreen from "@/screens/demos/ChipDemoScreen";
import CheckboxDemoScreen from "@/screens/demos/CheckboxDemoScreen";
import ProgressBarDemoScreen from "@/screens/demos/ProgressBarDemoScreen";
import SliderDemoScreen from "@/screens/demos/SliderDemoScreen";
import SwitchDemoScreen from "@/screens/demos/SwitchDemoScreen";
import SelectDemoScreen from "@/screens/demos/SelectDemoScreen";
import AppTextDemoScreen from "@/screens/demos/AppTextDemoScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";
import AboutScreen from "@/screens/AboutScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  // First run starts at the onboarding flow; once it has been completed (PRD
  // story 11), launches go straight to the tab shell. `completed` is persisted,
  // so this survives restarts.
  const onboardingCompleted = useAppSelector((state) => state.onboarding.completed);
  return (
    <Stack.Navigator
      initialRouteName={onboardingCompleted ? "Main" : "Onboarding"}
      screenOptions={{
        header: (props) => <CustomScreenHeader {...props} />,
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingStackNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="LessonPlayer"
        component={LessonPlayerScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Celebration"
        component={CelebrationScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="QuickReview"
        component={QuickReviewScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="MyLibrary"
        component={MyLibraryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ComponentsDemo"
        component={ComponentsDemo}
        options={{
          title: "Components Demo",
        }}
      />
      <Stack.Screen
        name="DesignSystem"
        component={DesignSystemScreen}
        options={{
          title: "Design System",
        }}
      />
      <Stack.Screen
        name="AppButtonDemo"
        component={AppButtonDemoScreen}
        options={{
          title: "Button Component",
        }}
      />
      <Stack.Screen
        name="AvatarDemo"
        component={AvatarDemoScreen}
        options={{
          title: "Avatar Component",
        }}
      />
      <Stack.Screen
        name="BadgeDemo"
        component={BadgeDemoScreen}
        options={{
          title: "Badge Component",
        }}
      />
      <Stack.Screen
        name="ChipDemo"
        component={ChipDemoScreen}
        options={{
          title: "Chip Component",
        }}
      />
      <Stack.Screen
        name="CheckboxDemo"
        component={CheckboxDemoScreen}
        options={{
          title: "Checkbox Component",
        }}
      />
      <Stack.Screen
        name="ProgressBarDemo"
        component={ProgressBarDemoScreen}
        options={{
          title: "Progress Bar Component",
        }}
      />
      <Stack.Screen
        name="SliderDemo"
        component={SliderDemoScreen}
        options={{
          title: "Slider Component",
        }}
      />
      <Stack.Screen
        name="SwitchDemo"
        component={SwitchDemoScreen}
        options={{
          title: "Switch Component",
        }}
      />
      <Stack.Screen
        name="SelectDemo"
        component={SelectDemoScreen}
        options={{
          title: "Select Component",
        }}
      />
      <Stack.Screen
        name="AppTextDemo"
        component={AppTextDemoScreen}
        options={{
          title: "Typography",
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          // Headerless: the auth screens carry their own back chevron + brand
          // mark (design.pen `NoJf8` 06b Đăng nhập).
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: "About",
        }}
      />
    </Stack.Navigator>
  );
};
