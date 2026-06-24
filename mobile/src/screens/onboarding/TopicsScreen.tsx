import React from "react";
import {ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText, Chip} from "@/components/ui";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {toggleTopic} from "@/features/onboarding/onboardingSlice.ts";
import {MIN_TOPICS, ONBOARDING_TOPICS} from "@/config/onboarding.ts";
import OnboardingProgress from "@/features/onboarding/components/OnboardingProgress.tsx";

/**
 * Chọn chủ đề — the topic picker (screens.md §2, handoff screen 02). Seeds the
 * **Interest Profile** at cold start (CONTEXT.md). The gate is real: "Tiếp tục"
 * is disabled until ≥ MIN_TOPICS are selected, with a live count of how many
 * more are needed (PRD story 2).
 */
export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();
  const selected = useAppSelector(state => state.onboarding.selectedTopicIds);

  const count = selected.length;
  const hasEnough = count >= MIN_TOPICS;
  const remaining = Math.max(0, MIN_TOPICS - count);

  return (
    <View className={"flex-1 bg-background"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 26, paddingTop: 18}}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress total={3} current={1}/>
        <AppText variant={"heading1"} className={"mb-1.5"}>
          ONBOARDING_TOPICS_TITLE
        </AppText>
        <AppText variant={"body"} color={"muted"} className={"mb-5"}>
          ONBOARDING_TOPICS_SUBTITLE
        </AppText>
        <View className={"flex-row flex-wrap gap-2.5"}>
          {ONBOARDING_TOPICS.map(topic => {
            const isSelected = selected.includes(topic.id);
            return (
              <Chip
                key={topic.id}
                size={"lg"}
                variant={"outline"}
                selected={isSelected}
                onPress={() => dispatch(toggleTopic(topic.id))}
              >
                {`${topic.emoji} ${t(topic.labelKey)}${isSelected ? " ✓" : ""}`}
              </Chip>
            );
          })}
        </View>
      </ScrollView>
      <View
        className={"flex-row items-center gap-3 px-6 pt-3.5 border-t border-hair"}
        style={{paddingBottom: insets.bottom + 12}}
      >
        <AppText
          variant={"bodySmall"}
          weight={"semibold"}
          color={hasEnough ? "primary" : "muted"}
          raw
        >
          {hasEnough
            ? t("ONBOARDING_TOPICS_SELECTED", {count})
            : t("ONBOARDING_TOPICS_NEED_MORE", {count: remaining})}
        </AppText>
        <AppButton
          variant={"primary"}
          size={"default"}
          className={"ml-auto rounded-2xl px-7"}
          disabled={!hasEnough}
          onPress={() => navigation.navigate("ReadingLevel")}
        >
          {t("ONBOARDING_CONTINUE")}
        </AppButton>
      </View>
    </View>
  );
}
