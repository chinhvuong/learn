import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import LearnScreen from "@/screens/LearnScreen.tsx";
import CreateScreen from "@/screens/CreateScreen.tsx";
import ChallengeScreen from "@/screens/ChallengeScreen.tsx";
import ProfileScreen from "@/screens/ProfileScreen.tsx";
import CustomTabBar from "@/navigation/components/CustomTabBar.tsx";

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * The four Inflow tabs (docs/design/screens.md "Navigation model"):
 *   Học (Home) · Tạo (Create) · Thử thách (Challenge) · Hồ sơ (Profile).
 * Labels are i18n keys resolved to Vietnamese in CustomTabBar; Học is the root
 * on every launch.
 */
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="LEARN"
        component={LearnScreen}
        options={{
          title: "TAB_LEARN",
        }}
      />
      <Tab.Screen
        name="CREATE"
        component={CreateScreen}
        options={{
          title: "TAB_CREATE",
        }}
      />
      <Tab.Screen
        name="CHALLENGE"
        component={ChallengeScreen}
        options={{
          title: "TAB_CHALLENGE",
        }}
      />
      <Tab.Screen
        name="PROFILE"
        component={ProfileScreen}
        options={{
          title: "TAB_PROFILE",
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
