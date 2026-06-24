import React from "react";
import {useTranslation} from "react-i18next";
import PlaceholderScreen from "@/screens/PlaceholderScreen.tsx";

/**
 * Hồ sơ (Profile) tab — North Star · Levels · Streak · Milestones ·
 * My Collection. Placeholder for now.
 */
export default function ProfileScreen() {
  const {t} = useTranslation();
  return (
    <PlaceholderScreen
      icon={"User"}
      title={t("TAB_PROFILE")}
      subtitle={t("PLACEHOLDER_PROFILE")}
    />
  );
}
