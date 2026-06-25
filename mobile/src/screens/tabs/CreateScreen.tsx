import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {urlSchema} from '@/validations/common';
import {createLesson} from '@/features/create/lessonCreation.service';
import ProcessingView from '@/features/create/components/ProcessingView';
import {
  creationFailed,
  creationQueuedAsync,
  creationReset,
  creationStarted,
  creationSucceeded,
} from '@/features/create/createSlice';
import {
  LessonCreationError,
  LessonCreationErrorCode,
  PickedFile,
  SourceInput,
  SourceType,
} from '@/features/create/types';

/**
 * Tạo (Create) tab — the signature feature: turn a Source the learner loves
 * into a Lesson (design §04 `YIOTF`; PRD creation stories; ADR-0005 staged
 * pipeline; ADR-0002 hybrid-async audio).
 *
 * Three input surfaces matching the design nodes:
 *   - composer (`fQ8zW`/`Hgzg7`): the link landing — paste a link inline; once a
 *     link is recognized a Source preview card appears and the CTA enables;
 *   - text sub-view (`K3Z9I`): a full-bleed serif paste area with a live
 *     word / estimated-Item count;
 *   - file sub-view (`kzp5K`): a picked-file card with an upload progress bar and
 *     the supported-format chips.
 * Plus the processing transition (`ReiP8`), the kind error, and the hybrid-async
 * "we'll notify you" acknowledgement.
 */

type ComposerView = 'composer' | 'text' | 'file';

/** Best-effort Source type from a pasted URL (YouTube → audio path, etc.). */
function sourceTypeForUrl(url: string): SourceType {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return SourceType.YOUTUBE;
  }
  if (u.includes('podcast') || u.includes('.mp3') || u.includes('spotify')) {
    return SourceType.PODCAST;
  }
  return SourceType.ARTICLE;
}

/**
 * A pasted link counts as a Source as soon as it looks like a URL — learners
 * paste bare domains ("youtube.com/…") far more often than fully-qualified
 * ones, and the design's recognized state shows exactly that. Prepend a
 * protocol if missing, then validate.
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isRecognizedUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return urlSchema.safeParse(normalizeUrl(trimmed)).success;
}

function errorCopyKey(code: LessonCreationErrorCode): string {
  switch (code) {
    case LessonCreationErrorCode.CONTENT_UNFETCHABLE:
      return 'CREATE_ERROR_UNFETCHABLE';
    case LessonCreationErrorCode.ANALYSIS_FAILED:
      return 'CREATE_ERROR_ANALYSIS';
    case LessonCreationErrorCode.MODERATION_REJECTED:
      return 'CREATE_ERROR_MODERATION';
    default:
      return 'CREATE_ERROR_UNKNOWN';
  }
}

/** A short, friendly host label for the processing subtitle. */
function hostOf(url: string): string {
  const m = url.match(/^https?:\/\/(?:www\.)?([^/]+)/i);
  if (m) return m[1];
  const bare = url.replace(/^www\./, '').split('/')[0];
  return bare || url;
}

/** Slow continuous rotation for the upload-button loader glyph. */
function Spinner() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {duration: 900, easing: Easing.linear}),
      -1,
    );
  }, [rotation]);
  const style = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));
  return (
    <Animated.View style={style}>
      <Icon name="LoaderCircle" className="text-ink3 w-[18px] h-[18px]" />
    </Animated.View>
  );
}

/** The Credit indicator: ●●●○○ + "remaining/total" (design 13a/13b). */
function CreditDots({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-row items-center gap-[5px]">
        {Array.from({length: total}).map((_, i) => (
          <View
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < remaining ? 'bg-flow' : 'bg-border'
            }`}
          />
        ))}
      </View>
      <AppText variant="bodySmall" className="text-flow-ink text-sm" weight="bold" raw>
        {remaining}/{total}
      </AppText>
    </View>
  );
}

/** The pinned primary CTA — teal when enabled, surface-2 / muted when not. */
function AnalyzeButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const {t} = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-2xl p-4 ${
        disabled ? 'bg-surface2' : 'bg-flow'
      }`}>
      <AppText
        variant="heading4"
        className={`text-md ${disabled ? 'text-ink3' : 'text-on-flow'}`}
        weight="bold"
        raw>
        {t('CREATE_SUBMIT')}
      </AppText>
    </Pressable>
  );
}

export default function CreateScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const colors = useColors();

  const {phase, creditsRemaining, creditsTotal, createdLessonId, errorCode} =
    useAppSelector(state => state.create);

  const [view, setView] = useState<ComposerView>('composer');
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [validationKey, setValidationKey] = useState<string | null>(null);

  const hasCredit = creditsRemaining > 0;

  // A persisted `processing` phase from a previous run is stale on a fresh
  // launch — reset to the composer when the tab mounts.
  useEffect(() => {
    if (phase === 'processing') {
      dispatch(creationReset());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When an inline creation finishes, open the new Lesson in the Player and
  // return the composer to idle (so coming back to the tab is clean).
  useEffect(() => {
    if (phase === 'ready' && createdLessonId) {
      const id = createdLessonId;
      dispatch(creationReset());
      setLink('');
      setText('');
      setFile(null);
      setView('composer');
      navigation.navigate('LessonPlayer', {lessonId: id});
    }
  }, [phase, createdLessonId, dispatch, navigation]);

  // A pasted link is "recognized" once it parses as a URL (design 13b).
  const linkRecognized = useMemo(() => isRecognizedUrl(link), [link]);

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );
  // A rough estimate of how many Items the engine will surface (design 13d shows
  // "~14 Item dự kiến" for 248 words ≈ one notable Item per ~18 words).
  const estimatedItems = Math.max(0, Math.round(wordCount / 18));

  /** Build the SourceInput for the active view, or null with a validation key. */
  const buildInput = useCallback((): {
    input: SourceInput | null;
    validationKey: string | null;
  } => {
    if (view === 'text') {
      const body = text.trim();
      if (!body) {
        return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
      }
      return {input: {type: SourceType.TEXT, text: body}, validationKey: null};
    }
    if (view === 'file') {
      if (!file) {
        return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
      }
      return {input: {type: SourceType.FILE, file}, validationKey: null};
    }
    // composer / link
    const raw = link.trim();
    if (!raw) {
      return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
    }
    if (!isRecognizedUrl(raw)) {
      return {input: null, validationKey: 'CREATE_VALIDATION_URL'};
    }
    const url = normalizeUrl(raw);
    return {input: {type: sourceTypeForUrl(url), url}, validationKey: null};
  }, [view, link, text, file]);

  const handleSubmit = useCallback(async () => {
    const {input, validationKey: vk} = buildInput();
    if (!input) {
      setValidationKey(vk);
      return;
    }
    setValidationKey(null);
    dispatch(creationStarted());
    try {
      const result = await createLesson(input);
      if (result.status === 'ready') {
        dispatch(
          creationSucceeded({lessonId: result.lessons[0]?.id ?? 'unknown'}),
        );
      } else {
        dispatch(creationQueuedAsync({jobId: result.jobId}));
      }
    } catch (err) {
      const code =
        err instanceof LessonCreationError
          ? err.code
          : LessonCreationErrorCode.UNKNOWN;
      dispatch(creationFailed({code}));
    }
  }, [buildInput, dispatch]);

  // Upload-file: a real document picker needs a native dep (not in this
  // boilerplate). Stub the pick so the file view's uploading state + the upload
  // Source path are fully exercised; swap for react-native-document-picker when
  // the native dep lands.
  const handlePickFile = useCallback(() => {
    setValidationKey(null);
    setFile({
      name: 'Bài đọc IELTS — Cambridge 18.pdf',
      uri: 'file:///stub/cambridge-18.pdf',
      mimeType: 'application/pdf',
    });
  }, []);

  const backToComposer = useCallback(() => {
    setView('composer');
    setValidationKey(null);
  }, []);

  const resetComposer = useCallback(() => {
    dispatch(creationReset());
    setLink('');
    setText('');
    setFile(null);
    setView('composer');
  }, [dispatch]);

  // --- Processing (design 13e) ---
  if (phase === 'processing') {
    const withAudio =
      view === 'composer' && sourceTypeForUrl(link) !== SourceType.ARTICLE;
    const subtitle =
      view === 'composer' && link.trim()
        ? `"The Future of AI" · ${hostOf(link.trim())}`
        : undefined;
    return (
      <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
        <ProcessingView withAudio={withAudio} subtitle={subtitle} />
      </View>
    );
  }

  // --- Hybrid-async acknowledgement (behavior beyond the §04 nodes) ---
  if (phase === 'async') {
    return (
      <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-flow-soft items-center justify-center mb-6">
            <Icon name="Bell" className="text-flow w-9 h-9" />
          </View>
          <AppText variant="heading2" align="center">
            {t('CREATE_ASYNC_TITLE')}
          </AppText>
          <AppText variant="body" color="muted" align="center" className="mt-2">
            {t('CREATE_ASYNC_BODY')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={resetComposer}
            className="mt-8 self-stretch items-center justify-center rounded-2xl p-4 bg-flow">
            <AppText variant="heading4" className="text-on-flow text-md" weight="bold" raw>
              {t('CREATE_ASYNC_ACK')}
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Kind error (behavior beyond the §04 nodes; no Credit consumed) ---
  if (phase === 'error') {
    return (
      <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-warm-soft items-center justify-center mb-6">
            <Icon name="Frown" className="text-warm w-9 h-9" />
          </View>
          <AppText variant="heading2" align="center">
            {t('CREATE_ERROR_TITLE')}
          </AppText>
          <AppText variant="body" color="muted" align="center" className="mt-2">
            {t(errorCopyKey(errorCode ?? LessonCreationErrorCode.UNKNOWN))}
          </AppText>
          <AppText
            variant="bodySmall"
            className="mt-3 text-warm-ink"
            align="center"
            weight="semibold">
            {t('CREATE_ERROR_NO_CHARGE')}
          </AppText>
          <View className="flex-row gap-3 mt-8 self-stretch">
            <Pressable
              accessibilityRole="button"
              onPress={() => dispatch(creationReset())}
              className="flex-1 items-center justify-center rounded-2xl p-4 bg-flow">
              <AppText variant="heading4" className="text-on-flow text-md" weight="bold" raw>
                {t('CREATE_ERROR_RETRY')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                dispatch(creationReset());
                setView('text');
              }}
              className="flex-1 items-center justify-center rounded-2xl p-4 border border-border">
              <AppText variant="heading4" className="text-ink text-md" weight="bold" raw>
                {t('CREATE_ERROR_PASTE_TEXT')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // --- Text sub-view (design 13d `K3Z9I`) ---
  if (view === 'text') {
    return (
      <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-4 gap-3.5"
          keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-2.5 pt-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={backToComposer}
              hitSlop={8}>
              <Icon name="ArrowLeft" className="text-ink w-6 h-6" />
            </Pressable>
            <AppText variant="heading3" weight="extrabold" className="text-lg" raw>
              {t('CREATE_TEXT_HEADER')}
            </AppText>
          </View>

          <View
            className="rounded-xl border-[1.5px] border-flow bg-surface p-3.5"
            style={{
              minHeight: 230,
              shadowColor: colors.flowSoft,
              shadowOpacity: 1,
              shadowRadius: 10,
              shadowOffset: {width: 0, height: 0},
              elevation: 2,
            }}>
            <TextInput
              value={text}
              onChangeText={txt => {
                setText(txt);
                setValidationKey(null);
              }}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder={t('CREATE_TEXT_PLACEHOLDER')}
              placeholderTextColor={colors.ink3}
              selectionColor={colors.flow}
              className="font-reading text-ink"
              style={{fontSize: 17, lineHeight: 25.5, minHeight: 200}}
            />
          </View>

          {/* Meta row — words · estimated Items · privacy */}
          <View className="flex-row flex-wrap items-center gap-1.5">
            <AppText variant="bodySmall" className="text-ink2 text-sm" raw>
              {t('CREATE_TEXT_META_WORDS', {count: wordCount})}
            </AppText>
            <AppText
              variant="bodySmall"
              className="text-flow-ink text-sm"
              weight="semibold"
              raw>
              {t('CREATE_TEXT_META_ITEMS', {count: estimatedItems})}
            </AppText>
            <AppText variant="bodySmall" className="text-ink3 text-sm" raw>
              {t('CREATE_TEXT_META_PRIVACY')}
            </AppText>
          </View>

          {validationKey ? (
            <AppText variant="bodySmall" color="error">
              {t(validationKey)}
            </AppText>
          ) : null}

          {/* Min-words warm tip */}
          <View className="bg-warm-soft rounded-xl p-3.5">
            <AppText variant="bodySmall" className="text-warm-ink text-sm" raw>
              {t('CREATE_TEXT_MIN_HINT')}
            </AppText>
          </View>
        </ScrollView>

        <View className="px-4 pb-3">
          <AnalyzeButton
            disabled={!hasCredit || text.trim().length === 0}
            onPress={handleSubmit}
          />
        </View>
      </View>
    );
  }

  // --- File sub-view (design 13c `kzp5K`) ---
  if (view === 'file') {
    return (
      <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-4 gap-4"
          keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-2.5 pt-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={backToComposer}
              hitSlop={8}>
              <Icon name="ArrowLeft" className="text-ink w-6 h-6" />
            </Pressable>
            <AppText variant="heading3" weight="extrabold" className="text-lg" raw>
              {t('CREATE_FILE_HEADER')}
            </AppText>
          </View>

          {/* File card — picked, uploading */}
          <View
            className="rounded-xl border-[1.5px] border-flow bg-surface p-3 gap-3"
            style={{
              shadowColor: colors.flowSoft,
              shadowOpacity: 1,
              shadowRadius: 10,
              shadowOffset: {width: 0, height: 0},
              elevation: 2,
            }}>
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-lg bg-error items-center justify-center">
                <AppText variant="caption" className="text-on-flow text-[11px]" weight="bold" raw>
                  PDF
                </AppText>
              </View>
              <View className="flex-1 gap-0.5">
                <AppText variant="bodySmall" className="text-ink text-sm" weight="semibold" raw>
                  {file?.name ?? 'Bài đọc IELTS — Cambridge 18.pdf'}
                </AppText>
                <AppText variant="caption" className="text-ink3 text-xs" raw>
                  {t('CREATE_FILE_UPLOADING', {size: '240 KB', percent: 62})}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove file"
                onPress={backToComposer}
                className="w-[22px] h-[22px] rounded-full bg-surface2 items-center justify-center">
                <Icon name="X" className="text-ink3 w-3 h-3" />
              </Pressable>
            </View>
            {/* Upload progress */}
            <View className="h-1.5 rounded-full bg-surface2 overflow-hidden">
              <View className="h-1.5 rounded-full bg-flow" style={{width: '62%'}} />
            </View>
          </View>

          {/* Privacy info row */}
          <View className="bg-surface2 rounded-xl p-3">
            <AppText variant="bodySmall" className="text-ink2 text-sm" raw>
              {t('CREATE_FILE_INFO')}
            </AppText>
          </View>

          {/* Supported formats */}
          <AppText variant="bodySmall" className="text-ink2 text-sm" weight="semibold" raw>
            {t('CREATE_FILE_SUPPORT')}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {['PDF', 'EPUB', 'TXT', '.docx'].map(fmt => (
              <View
                key={fmt}
                className="rounded-lg border border-border bg-surface px-3 py-1.5">
                <AppText variant="bodySmall" className="text-ink2 text-xs" weight="semibold" raw>
                  {fmt}
                </AppText>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="px-4 pb-3">
          {/* Uploading — disabled CTA with spinner (design 13c) */}
          <View className="flex-row items-center justify-center gap-2 rounded-2xl p-4 bg-surface2">
            <Spinner />
            <AppText variant="heading4" className="text-ink3 text-md" weight="bold" raw>
              {t('CREATE_FILE_UPLOADING_BTN')}
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  // --- Composer (design 13a `fQ8zW` empty / 13b `Hgzg7` link recognized) ---
  return (
    <View className="flex-1 bg-app-bg" style={{paddingTop: insets.top}}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-1 pb-4 gap-3.5"
        keyboardShouldPersistTaps="handled">
        <AppText
          variant="heading1"
          weight="extrabold"
          className="text-2xl"
          style={{lineHeight: 28.8}}
          raw>
          {t('CREATE_TITLE')}
        </AppText>

        {/* Subtitle only on the empty state (design 13a) */}
        {!linkRecognized ? (
          <AppText
            variant="body"
            className="text-ink2 text-base"
            style={{lineHeight: 19.6}}
            raw>
            {t('CREATE_SUBTITLE')}
          </AppText>
        ) : null}

        {/* 🔗 Link label */}
        <AppText variant="label" className="text-ink text-base" weight="semibold" raw>
          🔗 {t('CREATE_LINK_LABEL')}
        </AppText>

        {/* Link field — placeholder + Dán chip (empty); value + clear (filled) */}
        <View
          className={`flex-row items-center gap-2 rounded-xl bg-surface p-2.5 px-3 ${
            linkRecognized ? 'border-[1.5px] border-flow' : 'border border-border'
          }`}
          style={
            linkRecognized
              ? {
                  shadowColor: colors.flowSoft,
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  shadowOffset: {width: 0, height: 0},
                  elevation: 2,
                }
              : undefined
          }>
          <TextInput
            value={link}
            onChangeText={txt => {
              setLink(txt);
              setValidationKey(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={t('CREATE_LINK_PLACEHOLDER')}
            placeholderTextColor={colors.ink3}
            selectionColor={colors.flow}
            className="flex-1 text-ink"
            style={{fontSize: 14}}
          />
          {linkRecognized ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear link"
              onPress={() => setLink('')}
              className="w-[22px] h-[22px] rounded-full bg-surface2 items-center justify-center">
              <Icon name="X" className="text-ink3 w-3 h-3" />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                // Quick-fill affordance — the design's "Dán" chip pastes a link.
                setLink('youtube.com/watch?v=aiFuture');
                setValidationKey(null);
              }}
              className="rounded-lg bg-flow-soft px-3 py-1.5">
              <AppText variant="bodySmall" className="text-flow-ink text-sm" weight="semibold" raw>
                {t('CREATE_LINK_PASTE')}
              </AppText>
            </Pressable>
          )}
        </View>

        {linkRecognized ? (
          <>
            {/* ✓ Đã nhận diện nội dung */}
            <AppText
              variant="bodySmall"
              className="text-flow-ink text-sm"
              weight="semibold"
              raw>
              {t('CREATE_RECOGNIZED')}
            </AppText>

            {/* Source preview card */}
            <View className="rounded-xl border border-border bg-surface p-3 gap-3">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-[84px] h-[60px] rounded-lg items-center justify-center"
                  style={{backgroundColor: colors.flow}}>
                  <View className="w-7 h-7 rounded-full bg-on-flow items-center justify-center">
                    <Icon name="Play" className="text-flow-ink w-3.5 h-3.5" />
                  </View>
                </View>
                <View className="flex-1 gap-1">
                  <AppText variant="heading5" className="text-ink text-[15px]" weight="bold" raw>
                    The Future of AI
                  </AppText>
                  <AppText variant="caption" className="text-ink3 text-xs" raw>
                    YouTube · 12:30
                  </AppText>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg bg-flow-soft px-2.5 py-[5px]">
                  <AppText variant="caption" className="text-flow-ink text-xs" weight="semibold" raw>
                    B1
                  </AppText>
                </View>
                <View className="rounded-lg bg-surface2 px-2.5 py-[5px]">
                  <AppText variant="caption" className="text-ink2 text-xs" weight="semibold" raw>
                    ~18 Item
                  </AppText>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* hoặc divider */}
            <View className="flex-row items-center gap-2.5">
              <View className="flex-1 h-px bg-hair" />
              <AppText variant="caption" className="text-ink3 text-xs" raw>
                hoặc
              </AppText>
              <View className="flex-1 h-px bg-hair" />
            </View>

            {/* 📝 Dán text · 📎 Tải file option cards */}
            <View className="flex-row gap-3">
              {(
                [
                  {
                    key: 'text' as const,
                    label: '📝 ' + t('CREATE_TEXT_LABEL'),
                  },
                  {
                    key: 'file' as const,
                    label: '📎 ' + t('CREATE_FILE_LABEL'),
                  },
                ]
              ).map(opt => (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  onPress={() => {
                    setValidationKey(null);
                    if (opt.key === 'file') {
                      handlePickFile();
                    }
                    setView(opt.key);
                  }}
                  className="flex-1 gap-1.5 rounded-xl border border-border bg-surface p-3.5">
                  <AppText variant="label" className="text-ink text-base" weight="semibold" raw>
                    {opt.label}
                  </AppText>
                  <AppText variant="caption" className="text-ink3 text-xs" raw>
                    🔒 chỉ mình bạn
                  </AppText>
                </Pressable>
              ))}
            </View>

            {/* Share-from-anywhere warm tip */}
            <View className="bg-warm-soft rounded-xl p-3.5">
              <AppText variant="bodySmall" className="text-warm-ink text-sm" raw>
                {t('CREATE_SHARE_HINT')}
              </AppText>
            </View>
          </>
        )}

        {validationKey ? (
          <AppText variant="bodySmall" color="error">
            {t(validationKey)}
          </AppText>
        ) : null}

        {/* Credit row */}
        <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-3.5">
          <AppText variant="body" className="text-ink2 text-base" raw>
            {linkRecognized
              ? t('CREATE_CREDIT_USE')
              : t('CREATE_CREDITS_LABEL')}
          </AppText>
          <CreditDots remaining={creditsRemaining} total={creditsTotal} />
        </View>
      </ScrollView>

      <View className="px-4 pb-3">
        <AnalyzeButton
          disabled={!hasCredit || !linkRecognized}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}
