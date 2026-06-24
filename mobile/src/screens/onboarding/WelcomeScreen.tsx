import React from "react";
import {Pressable, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {OnboardingNavigationProp} from "@/navigation/types.ts";

/**
 * Welcome — the splash / value-prop, first onboarding screen (screens.md §1,
 * handoff screen 01). Carries the one-line promise verbatim and opens the
 * value-before-signup flow: "Bắt đầu" advances to the topic picker (never
 * straight into the tab shell — the learner experiences value first).
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();

  const handleStart = () => {
    navigation.navigate("Topics");
  };

  const handleSignIn = () => {
    // Existing-account path ("Đã có tài khoản? Đăng nhập"). The full sign-in
    // screen (handoff 06b) lands here; for now route to the boilerplate Login.
    navigation.getParent()?.navigate("Login");
  };

  return (
    <View
      className={"flex-1 bg-background items-center justify-center px-8"}
      style={{paddingTop: insets.top, paddingBottom: insets.bottom + 16}}
    >
      <View className={"flex-1 items-center justify-center"}>
        <View
          className={
            "w-16 h-16 rounded-3xl bg-flow items-center justify-center mb-6"
          }
        >
          <Icon name={"Sparkles"} className={"text-on-flow w-8 h-8"}/>
        </View>
        <AppText variant={"heading3"} weight={"bold"} align={"center"} className={"mb-1"}>
          Inflow
        </AppText>
        <AppText variant={"heading1"} align={"center"}>
          ONBOARDING_WELCOME_TITLE
        </AppText>
        <AppText
          variant={"body"}
          color={"muted"}
          align={"center"}
          className={"mt-3"}
        >
          ONBOARDING_WELCOME_SUBTITLE
        </AppText>
      </View>
      <View className={"w-full"}>
        <AppButton
          variant={"primary"}
          className={"w-full rounded-2xl"}
          onPress={handleStart}
        >
          {t("ONBOARDING_START")}
        </AppButton>
        <Pressable className={"mt-4 flex-row justify-center"} onPress={handleSignIn} hitSlop={8}>
          <AppText variant={"bodySmall"} color={"muted"} raw>
            {t("ONBOARDING_HAVE_ACCOUNT")}{" "}
            <AppText variant={"bodySmall"} color={"primary"} weight={"bold"} raw>
              {t("ONBOARDING_SIGN_IN")}
            </AppText>
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
