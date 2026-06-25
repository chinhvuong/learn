import React from "react";
import {Pressable, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import Svg, {Defs, LinearGradient, Rect, Stop} from "react-native-svg";
import {AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import InflowLogo from "@/components/ui/InflowLogo";
import {useColors} from "@/hooks/useColors.ts";
import {OnboardingNavigationProp} from "@/navigation/types.ts";

/** The animated-looking equalizer waveform inside the podcast card. */
const WAVE_HEIGHTS = [8, 15, 22, 12, 18, 24, 10, 16, 7, 20, 14, 9, 17, 23, 11, 19, 6, 13, 21, 10, 15, 8];
/** First N bars are "played" (teal `--flow`); the rest are `--border`. */
const WAVE_PLAYED = 9;

/** A small floating Source-type chip that hovers around the hero card. */
function FloatingChip({
  icon,
  label,
  tint,
  rotate,
  style,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  tint: "flow" | "warm";
  rotate: number;
  style: object;
}) {
  return (
    <View
      className={"absolute flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-[13px] bg-surface border border-hair"}
      style={[
        {
          transform: [{rotate: `${rotate}deg`}],
          shadowColor: "#2C3440",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 6},
          elevation: 3,
        },
        style,
      ]}
    >
      <Icon name={icon} className={`w-3.5 h-3.5 ${tint === "flow" ? "text-flow" : "text-warm"}`}/>
      <AppText variant={"labelSmall"} weight={"semibold"} color={"muted"} raw style={{fontSize: 12}}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * Welcome — the splash / value-prop, first onboarding screen (screens.md §1,
 * design.pen `v0Vkv`). Recreates the hero: brand row + language pill, a floating
 * "The Daily" podcast card with an absorbed-Chunk annotation and Source-type
 * chips, the two-tone promise headline, a free-to-start proof line, and the
 * primary CTA. "Bắt đầu miễn phí" opens the value-before-signup flow into the
 * topic picker (never straight into the tab shell — value first).
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const colors = useColors();

  const handleStart = () => {
    navigation.navigate("Topics");
  };

  const handleSignIn = () => {
    // Existing-account path ("Đã có tài khoản? Đăng nhập") → Login (handoff 06b).
    navigation.getParent()?.navigate("Login");
  };

  return (
    <View className={"flex-1 bg-app-bg"} style={{paddingTop: insets.top}}>
      {/* Top-down teal wash (flow-soft → app-bg) behind the hero. */}
      <Svg style={{position: "absolute", top: 0, left: 0, right: 0, height: 360}}>
        <Defs>
          <LinearGradient id="welcomeWash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.flowSoft} stopOpacity={1}/>
            <Stop offset="0.44" stopColor={colors.appBg} stopOpacity={1}/>
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={"100%"} height={"100%"} fill="url(#welcomeWash)"/>
      </Svg>

      <View
        className={"flex-1 justify-between px-5 pt-3.5"}
        style={{paddingBottom: insets.bottom + 18}}
      >
        {/* Brand row: Inflow mark + wordmark · language pill. */}
        <View className={"flex-row items-center justify-between"}>
          <View className={"flex-row items-center gap-2.5"}>
            <InflowLogo size={30} radius={10}/>
            <View className={"flex-row"}>
              <AppText weight={"extrabold"} raw style={{fontSize: 19, letterSpacing: -0.3}} className={"text-warm"}>
                In
              </AppText>
              <AppText weight={"extrabold"} raw style={{fontSize: 19, letterSpacing: -0.3}} className={"text-flow"}>
                flow
              </AppText>
            </View>
          </View>
          <View className={"flex-row items-center gap-1.5 px-[11px] py-1.5 rounded-full bg-surface border border-hair"}>
            <AppText variant={"labelSmall"} weight={"bold"} color={"muted"} raw style={{fontSize: 11, letterSpacing: 0.5}}>
              {t("ONBOARDING_LANG_VI")}
            </AppText>
            <Icon name={"ArrowRight"} className={"w-3 h-3 text-ink3"}/>
            <AppText variant={"labelSmall"} weight={"bold"} raw className={"text-flow"} style={{fontSize: 11, letterSpacing: 0.5}}>
              {t("ONBOARDING_LANG_EN")}
            </AppText>
          </View>
        </View>

        {/* Middle: hero illustration + promise headline. */}
        <View className={"items-center"} style={{gap: 26}}>
          {/* Hero — the podcast card with floating Source chips. */}
          <View className={"w-full"} style={{height: 236}}>
            {/* Main "The Daily" card. */}
            <View
              className={"absolute rounded-[20px] bg-surface border border-hair p-[15px]"}
              style={{
                left: 44,
                top: 60,
                width: 222,
                shadowColor: "#2C3440",
                shadowOpacity: 0.09,
                shadowRadius: 20,
                shadowOffset: {width: 0, height: 14},
                elevation: 8,
              }}
            >
              <View className={"flex-row items-center gap-[11px]"}>
                <View
                  className={"w-[46px] h-[46px] rounded-[13px] items-center justify-center bg-warm"}
                >
                  <Icon name={"Play"} className={"w-[18px] h-[18px] text-on-flow"}/>
                </View>
                <View className={"flex-1 gap-[3px]"}>
                  <AppText weight={"bold"} raw className={"text-ink"} style={{fontSize: 14.5}}>
                    {t("ONBOARDING_WELCOME_CARD_TITLE")}
                  </AppText>
                  <AppText weight={"medium"} color={"muted"} raw style={{fontSize: 11.5}}>
                    {t("ONBOARDING_WELCOME_CARD_SUB")}
                  </AppText>
                </View>
                <Icon name={"Sparkles"} className={"w-[18px] h-[18px] text-flow"}/>
              </View>

              {/* Equalizer waveform. */}
              <View className={"flex-row items-center mt-3"} style={{gap: 3, height: 24}}>
                {WAVE_HEIGHTS.map((h, i) => (
                  <View
                    key={i}
                    className={`rounded-[2px] ${i < WAVE_PLAYED ? "bg-flow" : "bg-border"}`}
                    style={{width: 3, height: h}}
                  />
                ))}
              </View>

              {/* Absorbed-Chunk annotation: “a [groundbreaking] idea”. */}
              <View className={"flex-row items-center mt-3"} style={{gap: 5}}>
                <AppText weight={"medium"} color={"muted"} raw style={{fontSize: 12.5}}>“a</AppText>
                <View className={"rounded-md bg-warm-soft px-[7px] py-[3px]"}>
                  <AppText weight={"bold"} raw className={"text-warm-ink"} style={{fontSize: 12.5}}>
                    groundbreaking
                  </AppText>
                </View>
                <AppText weight={"medium"} color={"muted"} raw style={{fontSize: 12.5}}>idea”</AppText>
              </View>
            </View>

            {/* Floating Source-type chips. */}
            <FloatingChip icon={"Headphones"} label={t("ONBOARDING_WELCOME_CHIP_PODCAST")} tint={"flow"} rotate={6} style={{left: 2, top: 10}}/>
            <FloatingChip icon={"Clapperboard"} label={t("ONBOARDING_WELCOME_CHIP_VIDEO")} tint={"warm"} rotate={-7} style={{right: 2, top: 2}}/>
            <FloatingChip icon={"FileText"} label={t("ONBOARDING_WELCOME_CHIP_ARTICLE")} tint={"flow"} rotate={-5} style={{left: 6, top: 188}}/>
          </View>

          {/* Promise headline (two-tone) + subtitle. */}
          <View className={"items-center"} style={{gap: 10}}>
            <View className={"items-center"}>
              <AppText
                weight={"extrabold"}
                align={"center"}
                raw
                className={"text-ink"}
                style={{fontSize: 27, lineHeight: 32}}
              >
                {t("ONBOARDING_WELCOME_TITLE_LINE1")}
              </AppText>
              <AppText
                weight={"extrabold"}
                align={"center"}
                raw
                className={"text-flow"}
                style={{fontSize: 27, lineHeight: 32}}
              >
                {t("ONBOARDING_WELCOME_TITLE_LINE2")}
              </AppText>
            </View>
            <AppText
              variant={"body"}
              color={"muted"}
              align={"center"}
              raw
              style={{fontSize: 14, lineHeight: 21, maxWidth: 266}}
            >
              {t("ONBOARDING_WELCOME_SUB")}
            </AppText>
          </View>
        </View>

        {/* Actions: proof line · primary CTA · sign-in link. */}
        <View className={"items-center"} style={{gap: 14}}>
          <View className={"flex-row items-center gap-1.5"}>
            <Icon name={"ShieldCheck"} className={"w-[15px] h-[15px] text-flow"}/>
            <AppText variant={"labelSmall"} weight={"medium"} color={"muted"} raw style={{fontSize: 12.5}}>
              {t("ONBOARDING_WELCOME_PROOF")}
            </AppText>
          </View>

          <Pressable
            onPress={handleStart}
            className={"w-full flex-row items-center justify-center gap-2 rounded-[17px] py-[17px] bg-flow active:opacity-90"}
            style={{
              shadowColor: colors.flow,
              shadowOpacity: 0.24,
              shadowRadius: 18,
              shadowOffset: {width: 0, height: 10},
              elevation: 6,
            }}
          >
            <AppText weight={"extrabold"} raw className={"text-on-flow"} style={{fontSize: 16}}>
              {t("ONBOARDING_WELCOME_CTA")}
            </AppText>
            <Icon name={"ArrowRight"} className={"w-[19px] h-[19px] text-on-flow"}/>
          </Pressable>

          <Pressable className={"flex-row justify-center px-1 py-0.5"} onPress={handleSignIn} hitSlop={8}>
            <AppText variant={"bodySmall"} color={"muted"} raw style={{fontSize: 13.5}}>
              {t("ONBOARDING_HAVE_ACCOUNT")}{" "}
              <AppText variant={"bodySmall"} weight={"bold"} raw className={"text-flow"} style={{fontSize: 13.5}}>
                {t("ONBOARDING_SIGN_IN")}
              </AppText>
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
