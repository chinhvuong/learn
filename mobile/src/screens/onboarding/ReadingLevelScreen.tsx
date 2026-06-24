import React, {useCallback, useRef} from "react";
import {Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
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
    navigation.getParent()?.navigate("LessonPlayer", {lessonId: GOLDEN_FIRST_LESSON.id});
  };

  return (
    <View className={"flex-1 bg-background"} style={{paddingTop: insets.top}}>
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{paddingHorizontal: 26, paddingTop: 18}}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress total={3} current={2}/>
        <AppText variant={"heading1"} className={"mb-4"}>
          ONBOARDING_LEVEL_TITLE
        </AppText>

        <View className={"gap-2.5"}>
          {READING_LEVEL_OPTIONS.map(option => {
            const isSelected = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                onPress={() => select(option.id)}
                className={`flex-row gap-3 p-4 rounded-2xl border ${
                  isSelected ? "bg-flow-soft border-flow" : "bg-surface border-border"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mt-0.5 items-center justify-center ${
                    isSelected ? "border-flow" : "border-border"
                  }`}
                >
                  {isSelected ? <View className={"w-2.5 h-2.5 rounded-full bg-flow"}/> : null}
                </View>
                <View className={"flex-1"}>
                  <AppText
                    variant={"heading4"}
                    weight={"bold"}
                    color={isSelected ? "primary" : "default"}
                  >
                    {option.titleKey}
                  </AppText>
                  <AppText
                    variant={"bodySmall"}
                    color={isSelected ? "primary" : "muted"}
                    className={"mt-0.5"}
                  >
                    {option.exampleKey}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className={"flex-row gap-2.5 mt-4 p-3.5 rounded-xl bg-warm-soft"}>
          <AppText variant={"body"} raw>💡</AppText>
          <AppText variant={"bodySmall"} weight={"semibold"} className={"flex-1 text-warm-ink"}>
            ONBOARDING_LEVEL_HINT
          </AppText>
        </View>
      </ScrollView>

      <View className={"px-6 pt-3.5"} style={{paddingBottom: insets.bottom + 12}}>
        <AppButton
          variant={"primary"}
          className={"w-full rounded-2xl"}
          onPress={startGoldenLesson}
        >
          {t("ONBOARDING_CONTINUE")}
        </AppButton>
      </View>
    </View>
  );
}
