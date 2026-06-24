import React from "react";
import {useTranslation} from "react-i18next";
import PlaceholderScreen from "@/screens/PlaceholderScreen.tsx";

/** Tạo (Create) tab — turn a Source into a Lesson. Placeholder for now. */
export default function CreateScreen() {
  const {t} = useTranslation();
  return (
    <PlaceholderScreen
      icon={"Plus"}
      title={t("TAB_CREATE")}
      subtitle={t("PLACEHOLDER_CREATE")}
    />
  );
}
