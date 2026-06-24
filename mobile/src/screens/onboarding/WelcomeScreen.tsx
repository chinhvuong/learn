import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {OnboardingNavigationProp} from "@/navigation/types.ts";

/**
 * Welcome — first onboarding screen (placeholder for now).
 *
 * Exists to anchor the onboarding stack in the navigation skeleton (issue #4).
 * "Bắt đầu" enters the tab shell; the full Welcome → Topics → Reading Level →
 * Golden First Lesson flow is built later.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();

  const handleStart = () => {
    // Replace the onboarding stack with the tab shell so back doesn't return here.
    navigation.getParent()?.reset({
      index: 0,
      routes: [{name: "Main"}],
    });
  };

  return (
    <View
      className={"flex-1 bg-background items-center justify-center px-8"}
      style={{paddingTop: insets.top, paddingBottom: insets.bottom + 16}}
    >
      <View className={"flex-1 items-center justify-center"}>
        <View
          className={
            "w-24 h-24 rounded-3xl bg-neutrals1000 items-center justify-center mb-8"
          }
        >
          <Icon name={"Sparkles"} className={"text-primary w-12 h-12"}/>
        </View>
        <AppText variant={"heading1"} align={"center"}>
          {t("ONBOARDING_WELCOME_TITLE")}
        </AppText>
        <AppText
          variant={"body"}
          color={"muted"}
          align={"center"}
          className={"mt-3"}
        >
          {t("ONBOARDING_WELCOME_SUBTITLE")}
        </AppText>
      </View>
      <AppButton
        variant={"primary"}
        className={"w-full rounded-full"}
        onPress={handleStart}
      >
        {t("ONBOARDING_START")}
      </AppButton>
    </View>
  );
}
