import React, {useCallback, useRef} from "react";
import {Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {useColors} from "@/hooks/useColors.ts";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {commitGoldenLessonProgress, setReadingLevel} from "@/features/onboarding/onboardingSlice.ts";
import {READING_LEVEL_OPTIONS} from "@/config/onboarding.ts";
import OnboardingProgress from "@/features/onboarding/components/OnboardingProgress.tsx";
import {GOLDEN_FIRST_LESSON} from "@/features/lesson/goldenFirstLesson.ts";
import type {LessonSessionState} from "@/features/lesson/lessonSessionSlice.ts";
import {countAbsorbed} from "@/features/lesson/lessonSessionSlice.ts";

/**
 * Compute the by-type Absorbed breakdown for the session recap by joining the
 * session's per-Item decisions with the Golden First Lesson's Items.
 */
function absorbedBreakdown(session: LessonSessionState) {
  const byId = Object.fromEntries(GOLDEN_FIRST_LESSON.items.map(i => [i.id, i]));
  const result = {vocabulary: 0, chunk: 0, grammarPoint: 0};
  session.projectedItemIds.forEach(id => {
    if (session.decided[id] !== "absorbed") return;
    const item = byId[id];
    if (!item) return;
    if (item.type === "vocabulary") result.vocabulary += 1;
    else if (item.type === "chunk") result.chunk += 1;
    else if (item.type === "grammarPoint") result.grammarPoint += 1;
  });
  return result;
}

/**
 * Level Đọc — self-select the **Reading Level** with plain-language CEFR
 * examples plus a "let the app figure it out" option (screens.md §3, handoff
 * screen 03, PRD stories 3/5). The **Listening Level is NOT asked** — it is
 * seeded as Reading − 1 band in the reducer (CONTEXT.md "Level").
 *
 * "Tiếp tục" launches the **Golden First Lesson** (the root LessonPlayer)
 * *before any signup* (PRD story 6). When the learner returns from the player
 * having completed it, the anonymous progress is committed and the flow
 * advances to the Result screen (the aha moment, then conversion).
 */
export default function ReadingLevelScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();
  const colors = useColors();

  const readingLevelSource = useAppSelector(s => s.onboarding.readingLevelSource);
  const readingLevel = useAppSelector(s => s.onboarding.readingLevel);
  const session = useAppSelector(s => s.lessonSession);

  // Track which option is selected by id (band can be null for "let app decide").
  const selectedId =
    readingLevelSource === "app-decide"
      ? "unsure"
      : READING_LEVEL_OPTIONS.find(o => o.band === readingLevel)?.id ?? "b1";

  // Whether we have launched the Golden First Lesson and are awaiting its result.
  const awaitingLesson = useRef(false);

  // On regaining focus after the LessonPlayer closes, if the bundled Golden
  // First Lesson session is completed, capture the anonymous progress and move
  // to Result. Uses the navigation focus event (no LessonPlayer edits needed).
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!awaitingLesson.current) return;
      awaitingLesson.current = false;
      if (session.lessonId === GOLDEN_FIRST_LESSON.id && session.completed) {
        dispatch(
          commitGoldenLessonProgress({
            absorbedTotal: countAbsorbed(session),
            breakdown: absorbedBreakdown(session),
          }),
        );
        navigation.navigate("Result");
      }
    });
    return unsubscribe;
  }, [navigation, session, dispatch]);

  const select = useCallback(
    (id: string) => {
      const option = READING_LEVEL_OPTIONS.find(o => o.id === id);
      if (!option) return;
      dispatch(
        setReadingLevel({
          band: option.band,
          source: option.band === null ? "app-decide" : "self-select",
        }),
      );
    },
    [dispatch],
  );

  const startGoldenLesson = () => {
    awaitingLesson.current = true;
    // `onboarding: true` tells the Player to hand back here on completion (vs.
    // the core-loop Lesson-complete view) so this screen's focus handler can
    // commit the anonymous progress and advance to Result.
    navigation.getParent()?.navigate("LessonPlayer", {
      lessonId: GOLDEN_FIRST_LESSON.id,
      onboarding: true,
    });
  };

  return (
    <View className={"flex-1 bg-app-bg"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8}}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress total={3} current={2}/>
        <AppText weight={"extrabold"} raw className={"text-ink mb-4"} style={{fontSize: 24, lineHeight: 30}}>
          {t("ONBOARDING_LEVEL_TITLE")}
        </AppText>

        <View style={{gap: 10}}>
          {READING_LEVEL_OPTIONS.map(option => {
            const isSelected = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                onPress={() => select(option.id)}
                className={`flex-row p-[14px] rounded-[14px] border active:opacity-90 ${
                  isSelected ? "bg-flow-soft border-flow" : "bg-surface border-border"
                }`}
                style={{gap: 12}}
              >
                <View
                  className={`w-5 h-5 rounded-[10px] mt-0.5 items-center justify-center border-2 ${
                    isSelected ? "bg-flow border-flow" : "bg-surface border-border"
                  }`}
                >
                  {isSelected ? <Icon name={"Check"} className={"w-3 h-3 text-on-flow"}/> : null}
                </View>
                <View className={"flex-1"} style={{gap: 3}}>
                  <AppText
                    weight={"bold"}
                    raw
                    className={isSelected ? "text-flow-ink" : "text-ink"}
                    style={{fontSize: 15.5}}
                  >
                    {t(option.titleKey)}
                  </AppText>
                  <AppText
                    raw
                    className={isSelected ? "text-flow-ink" : "text-ink2"}
                    style={{fontSize: 13.5, lineHeight: 20}}
                  >
                    {t(option.exampleKey)}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className={"mt-4 p-[14px] rounded-[14px] bg-warm-soft"}>
          <AppText raw className={"text-warm-ink"} style={{fontSize: 13.5, lineHeight: 20}}>
            {t("ONBOARDING_LEVEL_HINT")}
          </AppText>
        </View>
      </ScrollView>

      <View className={"px-5 pt-3"} style={{paddingBottom: insets.bottom + 20}}>
        <Pressable
          onPress={startGoldenLesson}
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
