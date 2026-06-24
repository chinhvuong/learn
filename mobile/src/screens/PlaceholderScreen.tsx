import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AppText} from "@/components/ui";
import Icon, {IconName} from "@/components/ui/Icon.tsx";

interface PlaceholderScreenProps {
  /** Localized screen title (already-translated string). */
  title: string;
  /** Localized supporting line describing what will live here. */
  subtitle?: string;
  /** Lucide icon name shown above the title. */
  icon?: IconName;
}

/**
 * Themed placeholder used by the navigation skeleton (issue #4).
 *
 * Every tab / modal destination renders one of these for now so the whole
 * navigation graph is wired and walkable before the real screens exist.
 * Colors come entirely from the Inflow design tokens via NativeWind classes,
 * so it re-themes for light/dark automatically.
 */
export default function PlaceholderScreen({
  title,
  subtitle,
  icon = "Sparkles",
}: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={"flex-1 bg-app-bg items-center justify-center px-8"}
      style={{paddingTop: insets.top, paddingBottom: insets.bottom}}
    >
      <View
        className={
          "w-20 h-20 rounded-full bg-flow-soft items-center justify-center mb-6"
        }
      >
        <Icon name={icon} className={"text-flow-ink w-9 h-9"}/>
      </View>
      <AppText variant={"heading2"} align={"center"}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          variant={"body"}
          color={"muted"}
          align={"center"}
          className={"mt-2"}
        >
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
