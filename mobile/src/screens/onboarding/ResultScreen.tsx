import React from "react";
import {Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {useColors} from "@/hooks/useColors.ts";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {setDailyGoal} from "@/features/onboarding/onboardingSlice.ts";
import {DAILY_GOAL_PRESETS} from "@/config/onboarding.ts";

/**
 * Kết quả + Daily Goal — the result screen shown right after the Golden First
 * Lesson (screens.md §5, design.pen `N5NT6Z`, PRD stories 7/8). It celebrates the
 * **North Star** jump + the by-type session recap on an amber (`--warm`) card
 * (the aha moment), then lets the learner set a **Daily Goal** from the
 * ≈5/10/20-minute presets. Only after this does the (delayed) signup appear.
 */
export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();
  const colors = useColors();

  const {absorbedTotal, breakdown} = useAppSelector(s => s.onboarding.anonymousProgress);
  const dailyGoalMinutes = useAppSelector(s => s.onboarding.dailyGoalMinutes);

  return (
    <View className={"flex-1 bg-app-bg"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8}}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — confetti + headline. */}
        <View className={"items-center"} style={{gap: 6}}>
          <AppText align={"center"} raw style={{fontSize: 48}}>🎉</AppText>
          <AppText weight={"extrabold"} align={"center"} raw className={"text-ink"} style={{fontSize: 23, lineHeight: 28}}>
            {t("ONBOARDING_RESULT_TITLE")}
          </AppText>
        </View>

        {/* North Star jump card (amber `--warm-soft`). */}
        <View className={"rounded-[18px] bg-warm-soft items-center mt-[18px]"} style={{paddingVertical: 20, paddingHorizontal: 18, gap: 4}}>
          <AppText weight={"bold"} raw className={"text-warm-ink"} style={{fontSize: 11, letterSpacing: 2}}>
            {t("ONBOARDING_RESULT_NORTH_STAR")}
          </AppText>
          <AppText weight={"extrabold"} align={"center"} raw className={"text-warm-ink"} style={{fontSize: 58, lineHeight: 61}}>
            {absorbedTotal}
          </AppText>
          <AppText weight={"semibold"} raw className={"text-warm-ink"} style={{fontSize: 14}}>
            {t("ONBOARDING_RESULT_ABSORBED", {count: absorbedTotal})}
          </AppText>
          <View className={"flex-row pt-2"} style={{gap: 16}}>
            <AppText raw className={"text-warm-ink"} style={{fontSize: 13.5}}>
              {t("ONBOARDING_RESULT_BREAKDOWN_VOCAB", {count: breakdown.vocabulary})}
            </AppText>
            <AppText raw className={"text-warm-ink"} style={{fontSize: 13.5}}>
              {t("ONBOARDING_RESULT_BREAKDOWN_CHUNK", {count: breakdown.chunk})}
            </AppText>
            <AppText raw className={"text-warm-ink"} style={{fontSize: 13.5}}>
              {t("ONBOARDING_RESULT_BREAKDOWN_GRAMMAR", {count: breakdown.grammarPoint})}
            </AppText>
          </View>
        </View>

        <AppText weight={"bold"} raw className={"text-ink mt-[18px] mb-2.5"} style={{fontSize: 16}}>
          {t("ONBOARDING_GOAL_TITLE")}
        </AppText>

        <View style={{gap: 10}}>
          {DAILY_GOAL_PRESETS.map(preset => {
            const isSelected = preset.minutes === dailyGoalMinutes;
            return (
              <Pressable
                key={preset.id}
                onPress={() => dispatch(setDailyGoal(preset.minutes))}
                className={`flex-row items-center p-[14px] rounded-[14px] border active:opacity-90 ${
                  isSelected ? "bg-flow-soft border-flow" : "bg-surface border-border"
                }`}
                style={{gap: 12}}
              >
                <View
                  className={`w-5 h-5 rounded-[10px] items-center justify-center border-2 ${
                    isSelected ? "bg-flow border-flow" : "bg-surface border-border"
                  }`}
                >
                  {isSelected ? <Icon name={"Check"} className={"w-3 h-3 text-on-flow"}/> : null}
                </View>
                <View className={"flex-1"} style={{gap: 2}}>
                  <AppText weight={"bold"} raw className={isSelected ? "text-flow-ink" : "text-ink"} style={{fontSize: 15}}>
                    {`${preset.emoji} ${t(preset.titleKey)}`}
                  </AppText>
                  <AppText raw className={isSelected ? "text-flow-ink" : "text-ink2"} style={{fontSize: 13}}>
                    {t(preset.subtitleKey)}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className={"px-5 pt-3"} style={{paddingBottom: insets.bottom + 20}}>
        <Pressable
          onPress={() => navigation.navigate("Signup")}
          className={"w-full items-center justify-center rounded-2xl py-4 bg-flow active:opacity-90"}
          style={{
            shadowColor: colors.flow,
            shadowOpacity: 0.24,
            shadowRadius: 14,
            shadowOffset: {width: 0, height: 8},
            elevation: 5,
          }}
        >
          <AppText weight={"bold"} raw className={"text-on-flow"} style={{fontSize: 16}}>
            {t("ONBOARDING_CONTINUE")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
