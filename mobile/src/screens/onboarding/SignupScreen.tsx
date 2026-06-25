import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {z} from "zod";
import {AppButton, AppInput, AppText} from "@/components/ui";
import {AppleIcon, GoogleIcon} from "@/components/ui/BrandIcons";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {migrateAnonymousProgressToAccount} from "@/features/onboarding/onboardingSlice.ts";

const emailSchema = z.string().email();

type Provider = "apple" | "google" | "email";

/**
 * Đăng ký — the **delayed signup** (screens.md §6, design.pen `a21pD`, PRD
 * stories 9/10). Appears only *after* the aha moment (Result), framed as
 * "saving my progress" — it anchors on the Items just Absorbed and the streak
 * just opened.
 *
 * Choosing any provider runs the real anonymous→account migration against the
 * store (`migrateAnonymousProgressToAccount`): the learner flips from anonymous
 * to an account and the Golden-First-Lesson North Star is folded into the
 * account's cumulative total, so nothing the learner just did is lost. Only
 * then does the push-priming screen appear.
 *
 * Apple/Google native auth is stubbed at this boundary — the provider choice is
 * recorded and the flow proceeds; the real OAuth handshake lands with the auth
 * integration.
 */
export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();
  const absorbedTotal = useAppSelector(s => s.onboarding.anonymousProgress.absorbedTotal);

  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const signUpWith = (provider: Provider) => {
    // Migrate anonymous progress into the new account (real against the store).
    dispatch(migrateAnonymousProgressToAccount({provider}));
    // Push priming is shown ONLY after signup (PRD story 11).
    navigation.navigate("PushPriming");
  };

  const submitEmail = () => {
    if (!emailSchema.safeParse(email.trim()).success) {
      setEmailError(t("ONBOARDING_SIGNUP_EMAIL_INVALID"));
      return;
    }
    setEmailError(null);
    signUpWith("email");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className={"flex-1 bg-app-bg"}
    >
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — flame tile + headline (anchored on the streak just opened). */}
        <View className={"items-center"} style={{gap: 16}}>
          <View className={"w-16 h-16 rounded-[18px] bg-warm-soft items-center justify-center"}>
            <AppText raw style={{fontSize: 30}}>🔥</AppText>
          </View>
          <AppText weight={"extrabold"} align={"center"} raw className={"text-ink"} style={{fontSize: 26, lineHeight: 31}}>
            {t("ONBOARDING_SIGNUP_TITLE")}
          </AppText>
          <AppText align={"center"} color={"muted"} raw style={{fontSize: 14.5, lineHeight: 22}}>
            {t("ONBOARDING_SIGNUP_SUBTITLE", {count: absorbedTotal})}
          </AppText>
        </View>

        {/* Bottom — provider buttons + terms. */}
        <View style={{gap: 12}}>
          {emailMode ? (
            <View style={{gap: 10}}>
              <AppInput
                placeholder={t("ONBOARDING_SIGNUP_EMAIL_PLACEHOLDER")}
                keyboardType={"email-address"}
                autoCapitalize={"none"}
                autoComplete={"email"}
                value={email}
                onChangeText={setEmail}
              />
              {emailError ? (
                <AppText variant={"bodySmall"} color={"error"} raw>{emailError}</AppText>
              ) : null}
              <AppButton variant={"primary"} className={"rounded-2xl"} onPress={submitEmail}>
                {t("ONBOARDING_SIGNUP_EMAIL_CONTINUE")}
              </AppButton>
            </View>
          ) : (
            <View style={{gap: 10}}>
              <Pressable
                onPress={() => signUpWith("apple")}
                className={"flex-row items-center justify-center gap-2 rounded-[14px] py-[15px] bg-ink active:opacity-90"}
              >
                <AppleIcon size={16} color="#F8FAFB"/>
                <AppText weight={"semibold"} raw className={"text-app-bg"} style={{fontSize: 15.5}}>
                  {t("ONBOARDING_SIGNUP_APPLE")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => signUpWith("google")}
                className={"flex-row items-center justify-center gap-2 rounded-[14px] py-[15px] bg-surface border border-border active:opacity-90"}
              >
                <GoogleIcon size={16}/>
                <AppText weight={"semibold"} raw className={"text-ink"} style={{fontSize: 15.5}}>
                  {t("ONBOARDING_SIGNUP_GOOGLE")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setEmailMode(true)}
                className={"flex-row items-center justify-center gap-2 rounded-[14px] py-[15px] bg-surface border border-border active:opacity-90"}
              >
                <AppText raw style={{fontSize: 15}}>✉️</AppText>
                <AppText weight={"semibold"} raw className={"text-ink"} style={{fontSize: 15.5}}>
                  {t("ONBOARDING_SIGNUP_EMAIL")}
                </AppText>
              </Pressable>
            </View>
          )}

          <AppText align={"center"} color={"muted"} raw style={{fontSize: 12, lineHeight: 17}}>
            {t("ONBOARDING_SIGNUP_TERMS_PREFIX")} {t("ONBOARDING_SIGNUP_TERMS")} · {t("ONBOARDING_SIGNUP_PRIVACY")}
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
