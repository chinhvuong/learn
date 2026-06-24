import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch} from "@/store/hooks.ts";
import {finishOnboarding, setNotificationPermission} from "@/features/onboarding/onboardingSlice.ts";

/**
 * Push priming — the notification opt-in (screens.md §7, handoff screen 07,
 * PRD story 11). Shown **only after signup**: it explains the benefit (streak
 * reminders + "your Lesson is ready") *before* the iOS system permission
 * prompt, so the learner understands why before the one-shot dialog.
 *
 * The actual OS permission request is stubbed at this boundary — "Bật thông
 * báo" records `granted` and "Để sau" records `denied`; both then finish
 * onboarding and hand off to Home. Wiring the real `requestPermissions()` lands
 * with the push integration.
 */
function BenefitRow({
  icon,
  tint,
  titleKey,
  descKey,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  tint: "warm" | "flow";
  titleKey: string;
  descKey: string;
}) {
  return (
    <View className={"flex-row gap-3 items-start"}>
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center ${
          tint === "warm" ? "bg-warm-soft" : "bg-flow-soft"
        }`}
      >
        <Icon name={icon} className={`w-5 h-5 ${tint === "warm" ? "text-warm" : "text-flow"}`}/>
      </View>
      <View className={"flex-1"}>
        <AppText variant={"heading5"} weight={"bold"}>{titleKey}</AppText>
        <AppText variant={"bodySmall"} color={"muted"} className={"mt-0.5"}>{descKey}</AppText>
      </View>
    </View>
  );
}

export default function PushPrimingScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();

  const finish = (granted: boolean) => {
    dispatch(setNotificationPermission(granted ? "granted" : "denied"));
    dispatch(finishOnboarding());
    // Replace the whole stack with the tab shell so Back can't return to onboarding.
    navigation.getParent()?.reset({index: 0, routes: [{name: "Main"}]});
  };

  return (
    <View
      className={"flex-1 bg-background px-7"}
      style={{paddingTop: insets.top, paddingBottom: insets.bottom + 16}}
    >
      <View className={"flex-1 justify-center"}>
        <View className={"relative w-20 h-20 mb-6"}>
          <View className={"absolute inset-0 rounded-3xl bg-flow-soft items-center justify-center"}>
            <Icon name={"Bell"} className={"text-flow w-9 h-9"}/>
          </View>
          <View
            className={"absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-warm items-center justify-center"}
          >
            <AppText variant={"labelSmall"} weight={"bold"} className={"text-white"} raw>1</AppText>
          </View>
        </View>

        <AppText variant={"display3"} weight={"bold"} className={"mb-5"}>
          ONBOARDING_PUSH_TITLE
        </AppText>

        <View className={"gap-3.5"}>
          <BenefitRow
            icon={"Flame"}
            tint={"warm"}
            titleKey={"ONBOARDING_PUSH_STREAK_TITLE"}
            descKey={"ONBOARDING_PUSH_STREAK_DESC"}
          />
          <BenefitRow
            icon={"Sparkles"}
            tint={"flow"}
            titleKey={"ONBOARDING_PUSH_READY_TITLE"}
            descKey={"ONBOARDING_PUSH_READY_DESC"}
          />
        </View>
      </View>

      <View className={"gap-3"}>
        <AppButton variant={"primary"} className={"w-full rounded-2xl"} onPress={() => finish(true)}>
          {t("ONBOARDING_PUSH_ENABLE")}
        </AppButton>
        <AppButton variant={"ghost"} className={"w-full rounded-2xl"} onPress={() => finish(false)}>
          {t("ONBOARDING_PUSH_LATER")}
        </AppButton>
      </View>
    </View>
  );
}
