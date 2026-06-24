import {useColors} from "@/hooks/useColors.ts";
import {Text, TouchableOpacity, View} from "react-native";
import {ChevronLeft} from "lucide-react-native";
import React from "react";
import {NativeStackHeaderProps} from "@react-navigation/native-stack";

/**
 * Inflow stack header chrome.
 *
 * Mirrors the in-phone headers in the design handoff (Inflow.dc.html): a
 * `var(--app-bg)` bar with a 1px `var(--hair)` bottom hairline and a heavy
 * (weight-800) title carried in Be Vietnam Pro with the negative tracking the
 * handoff uses on headings. Tokens come from the active Inflow set (useColors),
 * so the header re-themes for light/dark with nothing hardcoded.
 */
export default function CustomScreenHeader({
                                             navigation, route, options, back
                                           }: NativeStackHeaderProps) {
  const colors = useColors();

  return (
    <View
      className={'bg-app-bg px-4 py-3 pt-safe-offset-3 flex-row items-center border-b border-hair'}
    >
      {options.headerLeft ? (
        options.headerLeft({tintColor: colors.ink, canGoBack: !!back})
      ) : back ? (
        <TouchableOpacity
          onPress={navigation.goBack}
          style={{marginRight: 12}}
        >
          <ChevronLeft size={24} color={colors.ink}/>
        </TouchableOpacity>
      ) : null}
      <Text
        className={'text-ink text-xl font-sans-extrabold flex-1'}
        style={{letterSpacing: -0.4}}
        numberOfLines={1}
      >
        {options.title || route.name}
      </Text>
      {options.headerRight ? options.headerRight({
        tintColor: colors.ink,
        canGoBack: !!back,
      }) : null}
    </View>
  );
}
