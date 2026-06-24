import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {AppButton, AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {RootStackScreenProps} from "@/navigation/types.ts";

type Nav = RootStackScreenProps<"Main">["navigation"];

/**
 * Học (Home) tab — the root screen on every launch (screens.md §8). Placeholder
 * for now; the real Home (North Star · Daily Goal · Continue · Discover) lands
 * later. The "Continue" button opens the modal Lesson Player so the whole
 * navigation graph is walkable in the skeleton.
 */
export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <View
      className={"flex-1 bg-background items-center justify-center px-8"}
      style={{paddingTop: insets.top, paddingBottom: insets.bottom}}
    >
      <View
        className={
          "w-20 h-20 rounded-full bg-neutrals1000 items-center justify-center mb-6"
        }
      >
        <Icon name={"GraduationCap"} className={"text-primary w-9 h-9"}/>
      </View>
      <AppText variant={"heading2"} align={"center"}>
        {t("TAB_LEARN")}
      </AppText>
      <AppText
        variant={"body"}
        color={"muted"}
        align={"center"}
        className={"mt-2"}
      >
        {t("PLACEHOLDER_LEARN")}
      </AppText>
      <AppButton
        variant={"primary"}
        className={"rounded-full mt-8"}
        onPress={() => navigation.navigate("LessonPlayer", {})}
      >
        {t("HOME_CONTINUE")}
      </AppButton>
    </View>
  );
}
