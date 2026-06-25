import React from "react";
import {Pressable, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppText} from "@/components/ui";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch} from "@/store/hooks.ts";
import {finishOnboarding, setNotificationPermission} from "@/features/onboarding/onboardingSlice.ts";

/**
 * Push priming — the notification opt-in (screens.md §7, design.pen `JvIDh`,
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
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <View className={"flex-row items-center p-[14px] rounded-2xl bg-surface border border-border"} style={{gap: 12}}>
      <View className={"w-[42px] h-[42px] rounded-xl bg-flow-soft items-center justify-center"}>
        <AppText raw style={{fontSize: 20}}>{emoji}</AppText>
      </View>
      <View className={"flex-1"} style={{gap: 3}}>
        <AppText weight={"bold"} raw className={"text-ink"} style={{fontSize: 15}}>{title}</AppText>
        <AppText raw className={"text-ink2"} style={{fontSize: 13.5, lineHeight: 20}}>{desc}</AppText>
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
    <View className={"flex-1 bg-app-bg justify-between"} style={{paddingTop: insets.top}}>
      {/* Top — bell + headline + benefits. */}
      <View className={"items-center px-5 pt-[44px]"} style={{gap: 22}}>
        {/* Bell tile with the "1" notification badge. */}
        <View style={{width: 72, height: 72}}>
          <View className={"w-[72px] h-[72px] rounded-[20px] bg-flow-soft items-center justify-center"}>
            <AppText raw style={{fontSize: 34}}>🔔</AppText>
          </View>
          <View
            className={"absolute w-6 h-6 rounded-xl bg-warm items-center justify-center border-2 border-app-bg"}
            style={{right: -4, top: -4}}
          >
            <AppText weight={"extrabold"} raw className={"text-on-flow"} style={{fontSize: 13}}>1</AppText>
          </View>
        </View>

        <AppText weight={"extrabold"} align={"center"} raw className={"text-ink"} style={{fontSize: 26, lineHeight: 31}}>
          {t("ONBOARDING_PUSH_TITLE")}
        </AppText>

        <View className={"w-full pt-1.5"} style={{gap: 12}}>
          <BenefitRow
            emoji={"🔥"}
            title={t("ONBOARDING_PUSH_STREAK_TITLE")}
            desc={t("ONBOARDING_PUSH_STREAK_DESC")}
          />
          <BenefitRow
            emoji={"✨"}
            title={t("ONBOARDING_PUSH_READY_TITLE")}
            desc={t("ONBOARDING_PUSH_READY_DESC")}
          />
        </View>
      </View>

      {/* Foot — enable / later. */}
      <View className={"px-5 pt-3"} style={{gap: 4, paddingBottom: insets.bottom + 20}}>
        <Pressable
          onPress={() => finish(true)}
          className={"w-full items-center justify-center rounded-2xl py-4 bg-flow active:opacity-90"}
        >
          <AppText weight={"bold"} raw className={"text-on-flow"} style={{fontSize: 16}}>
            {t("ONBOARDING_PUSH_ENABLE")}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => finish(false)}
          className={"w-full items-center justify-center rounded-2xl py-3.5 active:opacity-70"}
        >
          <AppText weight={"semibold"} raw className={"text-ink3"} style={{fontSize: 15}}>
            {t("ONBOARDING_PUSH_LATER")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
