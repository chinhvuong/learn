import React from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {MainTabParamList} from "./types";
import LearnScreen from "@/screens/tabs/LearnScreen.tsx";
import CreateScreen from "@/screens/tabs/CreateScreen.tsx";
import ChallengeScreen from "@/screens/tabs/ChallengeScreen.tsx";
import ProfileScreen from "@/screens/tabs/ProfileScreen.tsx";
import CustomTabBar from "@/navigation/components/CustomTabBar.tsx";

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * The four Inflow tabs — Học · Tạo · Thử thách · Hồ sơ (screens.md
 * "Navigation model"). Học (Learn) is the root on every launch.
 *
 * `title` holds an i18n key; CustomTabBar runs it through `t()` so labels
 * render as Vietnamese product copy and follow language changes.
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
        name="Learn"
        component={LearnScreen}
        options={{title: "TAB_LEARN"}}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{title: "TAB_CREATE"}}
      />
      <Tab.Screen
        name="Challenge"
        component={ChallengeScreen}
        options={{title: "TAB_CHALLENGE"}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: "TAB_PROFILE"}}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
