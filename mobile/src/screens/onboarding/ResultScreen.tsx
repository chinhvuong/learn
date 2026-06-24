import React from "react";
import {Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {setDailyGoal} from "@/features/onboarding/onboardingSlice.ts";
import {DAILY_GOAL_PRESETS} from "@/config/onboarding.ts";

/**
 * Kết quả + Daily Goal — the result screen shown right after the Golden First
 * Lesson (screens.md §5, handoff screen 05, PRD stories 7/8). It celebrates the
 * **North Star** jump + the by-type session recap (the aha moment), then lets
 * the learner set a **Daily Goal** from the ≈5/10/20-minute presets. Only after
 * this does the (delayed) signup appear.
 */
export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();

  const {absorbedTotal, breakdown} = useAppSelector(s => s.onboarding.anonymousProgress);
  const dailyGoalMinutes = useAppSelector(s => s.onboarding.dailyGoalMinutes);

  return (
    <View className={"flex-1 bg-background"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 26, paddingTop: 14}}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant={"display2"} align={"center"} raw>🎉</AppText>
        <AppText variant={"heading1"} align={"center"} className={"mb-4 mt-1"}>
          ONBOARDING_RESULT_TITLE
        </AppText>

        {/* North Star jump card (amber `--warm`). */}
        <View className={"rounded-3xl bg-warm-soft px-5 py-6 mb-5 items-center"}>
          <AppText variant={"overline"} className={"text-warm-ink"} raw>
            {t("ONBOARDING_RESULT_NORTH_STAR")}
          </AppText>
          <AppText weight={"bold"} align={"center"} className={"text-warm-ink text-5xl my-1"} raw>
            {absorbedTotal}
          </AppText>
          <AppText variant={"bodySmall"} weight={"bold"} className={"text-warm-ink"} raw>
            {t("ONBOARDING_RESULT_ABSORBED", {count: absorbedTotal})}
          </AppText>
          <View className={"flex-row gap-4 mt-3"}>
            <AppText variant={"bodySmall"} weight={"semibold"} className={"text-warm-ink"} raw>
              {t("ONBOARDING_RESULT_BREAKDOWN_VOCAB", {count: breakdown.vocabulary})}
            </AppText>
            <AppText variant={"bodySmall"} weight={"semibold"} className={"text-warm-ink"} raw>
              {t("ONBOARDING_RESULT_BREAKDOWN_CHUNK", {count: breakdown.chunk})}
            </AppText>
            <AppText variant={"bodySmall"} weight={"semibold"} className={"text-warm-ink"} raw>
              {t("ONBOARDING_RESULT_BREAKDOWN_GRAMMAR", {count: breakdown.grammarPoint})}
            </AppText>
          </View>
        </View>

        <AppText variant={"heading4"} weight={"bold"} className={"mb-1"}>
          ONBOARDING_GOAL_TITLE
        </AppText>
        <AppText variant={"bodySmall"} color={"muted"} className={"mb-3"}>
          ONBOARDING_GOAL_SUBTITLE
        </AppText>

        <View className={"gap-2.5"}>
          {DAILY_GOAL_PRESETS.map(preset => {
            const isSelected = preset.minutes === dailyGoalMinutes;
            return (
              <Pressable
                key={preset.id}
                onPress={() => dispatch(setDailyGoal(preset.minutes))}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                  isSelected ? "bg-flow-soft border-flow" : "bg-surface border-border"
                }`}
              >
                <AppText variant={"heading3"} raw>{preset.emoji}</AppText>
                <View className={"flex-1"}>
                  <AppText
                    variant={"heading5"}
                    weight={"bold"}
                    color={isSelected ? "primary" : "default"}
                  >
                    {preset.titleKey}
                  </AppText>
                  <AppText
                    variant={"bodySmall"}
                    color={isSelected ? "primary" : "muted"}
                  >
                    {preset.subtitleKey}
                  </AppText>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    isSelected ? "border-flow" : "border-border"
                  }`}
                >
                  {isSelected ? <View className={"w-2.5 h-2.5 rounded-full bg-flow"}/> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className={"px-6 pt-3.5"} style={{paddingBottom: insets.bottom + 12}}>
        <AppButton
          variant={"primary"}
          className={"w-full rounded-2xl"}
          onPress={() => navigation.navigate("Signup")}
        >
          {t("ONBOARDING_CONTINUE")}
        </AppButton>
      </View>
    </View>
  );
}
