import React from "react";
import {useTranslation} from "react-i18next";
import PlaceholderScreen from "@/screens/PlaceholderScreen.tsx";

/** Thử thách (Challenge Feed) tab — Reels-style Challenges. Placeholder for now. */
export default function ChallengeScreen() {
  const {t} = useTranslation();
  return (
    <PlaceholderScreen
      icon={"Zap"}
      title={t("TAB_CHALLENGE")}
      subtitle={t("PLACEHOLDER_CHALLENGE")}
    />
  );
}
