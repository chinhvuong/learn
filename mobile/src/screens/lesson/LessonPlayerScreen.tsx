import React from "react";
import {TouchableOpacity, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {useColors} from "@/hooks/useColors.ts";
import {RootStackScreenProps} from "@/navigation/types.ts";

type Props = RootStackScreenProps<"LessonPlayer">;

/**
 * Lesson Player — presented as a full-screen modal stack over the tabs
 * (issue #4). Placeholder for now; the Reading / Listening Replay states
 * (screens.md §9–§10b) are built later. Carries a `lessonId` route param so
 * Home's "Continue" / recommendations can deep-link into a specific Lesson.
 */
export default function LessonPlayerScreen({route}: Props) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const navigation = useNavigation();
  const {lessonId} = route.params ?? {};

  return (
    <View className={"flex-1 bg-background"} style={{paddingTop: insets.top}}>
      <View className={"px-4 py-3 flex-row items-center"}>
        <TouchableOpacity
          accessibilityRole={"button"}
          accessibilityLabel={t("CLOSE")}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Icon name={"X"} className={"text-foreground w-6 h-6"}/>
        </TouchableOpacity>
      </View>
      <View className={"flex-1 items-center justify-center px-8"}>
        <View
          className={
            "w-20 h-20 rounded-full bg-neutrals1000 items-center justify-center mb-6"
          }
        >
          <Icon name={"BookOpenText"} className={"text-primary w-9 h-9"}/>
        </View>
        <AppText variant={"heading2"} align={"center"}>
          {t("LESSON_PLAYER")}
        </AppText>
        <AppText
          variant={"body"}
          color={"muted"}
          align={"center"}
          className={"mt-2"}
        >
          {t("PLACEHOLDER_LESSON_PLAYER")}
        </AppText>
        {lessonId ? (
          <AppText variant={"caption"} color={"muted"} className={"mt-4"} raw>
            lessonId: {lessonId}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
