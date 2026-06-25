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
import {toggleTopic} from "@/features/onboarding/onboardingSlice.ts";
import {MIN_TOPICS, ONBOARDING_TOPICS} from "@/config/onboarding.ts";
import OnboardingProgress from "@/features/onboarding/components/OnboardingProgress.tsx";

/**
 * Chọn chủ đề — the topic picker (screens.md §2, design.pen `e6t3i` empty /
 * `myPdm` selected). Seeds the **Interest Profile** at cold start (CONTEXT.md).
 * The gate is real: "Tiếp tục" is disabled (muted fill) until ≥ MIN_TOPICS are
 * selected; the hint shows how many more are needed, then flips to "Đã chọn N ✓"
 * (PRD story 2).
 */
export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();
  const colors = useColors();
  const selected = useAppSelector(state => state.onboarding.selectedTopicIds);

  const count = selected.length;
  const hasEnough = count >= MIN_TOPICS;
  const remaining = Math.max(0, MIN_TOPICS - count);

  return (
    <View className={"flex-1 bg-app-bg"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8}}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress total={3} current={1}/>
        <View className={"gap-2"}>
          <AppText weight={"extrabold"} raw className={"text-ink"} style={{fontSize: 24, lineHeight: 30}}>
            {t("ONBOARDING_TOPICS_TITLE")}
          </AppText>
          <AppText variant={"body"} color={"muted"} raw style={{fontSize: 14, lineHeight: 21}}>
            {t("ONBOARDING_TOPICS_SUBTITLE")}
          </AppText>
        </View>

        <View className={"flex-row flex-wrap mt-[18px]"} style={{gap: 8}}>
          {ONBOARDING_TOPICS.map(topic => {
            const isSelected = selected.includes(topic.id);
            return (
              <Pressable
                key={topic.id}
                onPress={() => dispatch(toggleTopic(topic.id))}
                className={`flex-row items-center px-[14px] py-[10px] rounded-xl border active:opacity-80 ${
                  isSelected ? "bg-flow-soft border-flow" : "bg-surface border-border"
                }`}
                style={{gap: 7}}
              >
                <AppText raw className={"text-ink"} style={{fontSize: 15}}>
                  {topic.emoji}
                </AppText>
                <AppText
                  weight={"medium"}
                  raw
                  className={isSelected ? "text-flow-ink" : "text-ink"}
                  style={{fontSize: 14}}
                >
                  {t(topic.labelKey)}
                </AppText>
                {isSelected ? (
                  <View className={"w-4 h-4 rounded-lg bg-flow items-center justify-center"}>
                    <Icon name={"Check"} className={"w-2.5 h-2.5 text-on-flow"}/>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        className={"flex-row items-center justify-between px-5 pt-[14px] border-t border-hair"}
        style={{paddingBottom: insets.bottom + 14}}
      >
        <AppText
          weight={hasEnough ? "semibold" : "regular"}
          raw
          className={hasEnough ? "text-flow-ink" : "text-ink3"}
          style={{fontSize: 13.5}}
        >
          {hasEnough
            ? t("ONBOARDING_TOPICS_SELECTED", {count})
            : t("ONBOARDING_TOPICS_NEED_MORE", {count: remaining})}
        </AppText>
        <Pressable
          disabled={!hasEnough}
          onPress={() => navigation.navigate("ReadingLevel")}
          className={`rounded-2xl px-5 py-3 active:opacity-90 ${hasEnough ? "bg-flow" : "bg-surface2"}`}
          style={
            hasEnough
              ? {
                  shadowColor: colors.flow,
                  shadowOpacity: 0.24,
                  shadowRadius: 14,
                  shadowOffset: {width: 0, height: 8},
                  elevation: 5,
                }
              : undefined
          }
        >
          <AppText weight={"bold"} raw className={hasEnough ? "text-on-flow" : "text-ink3"} style={{fontSize: 16}}>
            {t("ONBOARDING_CONTINUE")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
