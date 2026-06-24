import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/native";
import {z} from "zod";
import {AppButton, AppInput, AppText} from "@/components/ui";
import Icon from "@/components/ui/Icon.tsx";
import {OnboardingNavigationProp} from "@/navigation/types.ts";
import {useAppDispatch, useAppSelector} from "@/store/hooks.ts";
import {migrateAnonymousProgressToAccount} from "@/features/onboarding/onboardingSlice.ts";

const emailSchema = z.string().email();

type Provider = "apple" | "google" | "email";

/**
 * Đăng ký — the **delayed signup** (screens.md §6, handoff screen 06, PRD
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
      className={"flex-1 bg-background"}
    >
      <ScrollView
        className={"flex-1"}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        <View className={"flex-1 justify-center"}>
          <View className={"w-14 h-14 rounded-2xl bg-warm-soft items-center justify-center mb-5"}>
            <Icon name={"Flame"} className={"text-warm w-7 h-7"}/>
          </View>
          <AppText variant={"display3"} weight={"bold"} className={"mb-2.5"}>
            ONBOARDING_SIGNUP_TITLE
          </AppText>
          <AppText variant={"body"} color={"muted"} className={"mb-7"} raw>
            {t("ONBOARDING_SIGNUP_SUBTITLE", {count: absorbedTotal})}
          </AppText>

          {emailMode ? (
            <View className={"gap-3"}>
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
            <View className={"gap-3"}>
              <AppButton
                variant={"default"}
                className={"rounded-2xl bg-neutrals1000"}
                textClassname={"text-background"}
                icon={<Icon name={"Apple"} className={"text-background"}/>}
                onPress={() => signUpWith("apple")}
              >
                {t("ONBOARDING_SIGNUP_APPLE")}
              </AppButton>
              <AppButton
                variant={"outline"}
                className={"rounded-2xl"}
                icon={<Icon name={"Globe"} className={"text-foreground"}/>}
                onPress={() => signUpWith("google")}
              >
                {t("ONBOARDING_SIGNUP_GOOGLE")}
              </AppButton>
              <AppButton
                variant={"outline"}
                className={"rounded-2xl"}
                icon={<Icon name={"Mail"} className={"text-foreground"}/>}
                onPress={() => setEmailMode(true)}
              >
                {t("ONBOARDING_SIGNUP_EMAIL")}
              </AppButton>
            </View>
          )}
        </View>

        <Pressable className={"items-center pt-6"} onPress={() => undefined}>
          <AppText variant={"labelSmall"} color={"muted"} align={"center"} raw>
            {t("ONBOARDING_SIGNUP_TERMS_PREFIX")}{" "}
            <AppText variant={"labelSmall"} weight={"semibold"} raw>
              {t("ONBOARDING_SIGNUP_TERMS")}
            </AppText>{" · "}
            <AppText variant={"labelSmall"} weight={"semibold"} raw>
              {t("ONBOARDING_SIGNUP_PRIVACY")}
            </AppText>
          </AppText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
