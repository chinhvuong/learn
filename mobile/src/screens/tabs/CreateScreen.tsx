import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppButton, AppInput, AppText, Icon, ProgressBar} from '@/components/ui';
import {cn} from '@/utils';
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
  CreateMode,
  LessonCreationError,
  LessonCreationErrorCode,
  PickedFile,
  SourceInput,
  SourceType,
} from '@/features/create/types';

/**
 * Tạo (Create) tab — the signature feature: turn a Source the learner loves
 * into a Lesson (screens.md §13; PRD creation stories; ADR-0005 staged
 * pipeline; ADR-0002 hybrid-async audio).
 *
 * Supports three input modes (paste-link / paste-text / upload-file), each with
 * empty + filled states; shows remaining Creation Credits before creating;
 * calls the real createLesson seam (issue #3) and plays a processing
 * transition; opens the resulting Lesson in the Player on success; shows a kind
 * error that consumes no Credit on failure; and routes long audio Sources to an
 * async "we'll notify you when ready" stub instead of blocking the UI.
 */

const MODES: {
  key: CreateMode;
  icon: 'Link' | 'FileText' | 'Paperclip';
  labelKey: string;
}[] = [
  {key: 'link', icon: 'Link', labelKey: 'CREATE_MODE_LINK'},
  {key: 'text', icon: 'FileText', labelKey: 'CREATE_MODE_TEXT'},
  {key: 'file', icon: 'Paperclip', labelKey: 'CREATE_MODE_FILE'},
];

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

export default function CreateScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const {phase, creditsRemaining, creditsTotal, createdLessonId, errorCode} =
    useAppSelector(state => state.create);

  const [mode, setMode] = useState<CreateMode>('link');
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
      navigation.navigate('LessonPlayer', {lessonId: id});
    }
  }, [phase, createdLessonId, dispatch, navigation]);

  /** Build the SourceInput for the active mode, or null if the input is empty. */
  const buildInput = useCallback((): {
    input: SourceInput | null;
    validationKey: string | null;
  } => {
    if (mode === 'link') {
      const url = link.trim();
      if (!url) {
        return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
      }
      if (!urlSchema.safeParse(url).success) {
        return {input: null, validationKey: 'CREATE_VALIDATION_URL'};
      }
      return {input: {type: sourceTypeForUrl(url), url}, validationKey: null};
    }
    if (mode === 'text') {
      const body = text.trim();
      if (!body) {
        return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
      }
      return {input: {type: SourceType.TEXT, text: body}, validationKey: null};
    }
    // file
    if (!file) {
      return {input: null, validationKey: 'CREATE_VALIDATION_REQUIRED'};
    }
    return {input: {type: SourceType.FILE, file}, validationKey: null};
  }, [mode, link, text, file]);

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
        // Inline / cache-hit: a Credit is consumed, then we open the Lesson.
        dispatch(
          creationSucceeded({lessonId: result.lessons[0]?.id ?? 'unknown'}),
        );
      } else {
        // Long audio Source → hybrid-async (ADR-0002): don't block the UI.
        dispatch(creationQueuedAsync({jobId: result.jobId}));
      }
    } catch (err) {
      // Failed creation → kind error, NO Credit consumed (CONTEXT.md).
      const code =
        err instanceof LessonCreationError
          ? err.code
          : LessonCreationErrorCode.UNKNOWN;
      dispatch(creationFailed({code}));
    }
  }, [buildInput, dispatch]);

  // Upload-file: a real document picker needs a native dep (not in this
  // boilerplate). Stub the pick so the file mode's filled state + the upload
  // Source path are fully exercised; swap for react-native-document-picker
  // when the native dep lands.
  const handlePickFile = useCallback(() => {
    setValidationKey(null);
    setFile({
      name: 'my-article.txt',
      uri: 'file:///stub/my-article.txt',
      mimeType: 'text/plain',
    });
  }, []);

  const resetComposer = useCallback(() => {
    dispatch(creationReset());
    setLink('');
    setText('');
    setFile(null);
  }, [dispatch]);

  if (phase === 'processing') {
    const withAudio =
      mode === 'link' && sourceTypeForUrl(link) !== SourceType.ARTICLE;
    return (
      <View className="flex-1 bg-background" style={{paddingTop: insets.top}}>
        <ProcessingView withAudio={withAudio} />
      </View>
    );
  }

  if (phase === 'async') {
    return (
      <View className="flex-1 bg-background" style={{paddingTop: insets.top}}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-flowSoft items-center justify-center mb-6">
            <Icon name="Bell" className="text-flow w-9 h-9" />
          </View>
          <AppText variant="heading2" align="center">
            {t('CREATE_ASYNC_TITLE')}
          </AppText>
          <AppText variant="body" color="muted" align="center" className="mt-2">
            {t('CREATE_ASYNC_BODY')}
          </AppText>
          <AppButton
            variant="primary"
            className="mt-8 self-stretch"
            onPress={resetComposer}>
            {t('CREATE_ASYNC_ACK')}
          </AppButton>
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="flex-1 bg-background" style={{paddingTop: insets.top}}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-neutrals1000 items-center justify-center mb-6">
            <Icon name="Frown" className="text-warning w-9 h-9" />
          </View>
          <AppText variant="heading2" align="center">
            {t('CREATE_ERROR_TITLE')}
          </AppText>
          <AppText variant="body" color="muted" align="center" className="mt-2">
            {t(errorCopyKey(errorCode ?? LessonCreationErrorCode.UNKNOWN))}
          </AppText>
          <AppText
            variant="bodySmall"
            color="warning"
            align="center"
            className="mt-3">
            {t('CREATE_ERROR_NO_CHARGE')}
          </AppText>
          <View className="flex-row gap-3 mt-8 self-stretch">
            <AppButton
              variant="primary"
              className="flex-1"
              onPress={() => dispatch(creationReset())}>
              {t('CREATE_ERROR_RETRY')}
            </AppButton>
            <AppButton
              variant="outline"
              className="flex-1"
              onPress={() => {
                dispatch(creationReset());
                setMode('text');
              }}>
              {t('CREATE_ERROR_PASTE_TEXT')}
            </AppButton>
          </View>
        </View>
      </View>
    );
  }

  // Whether the active mode currently holds usable input — drives the CTA
  // disabled state alongside the Credit check.
  const hasInput =
    mode === 'link'
      ? link.trim().length > 0
      : mode === 'text'
        ? text.trim().length > 0
        : file !== null;

  // idle — the single-screen composer (design 13a): link input + "hoặc" + the
  // Dán text / Tải file cards, all visible together; the active card reveals
  // its input inline.
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 pb-10"
      style={{paddingTop: insets.top}}
      keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center gap-3 mt-4 mb-3">
        <View className="w-12 h-12 rounded-full bg-flowSoft items-center justify-center">
          <Icon name="Sparkles" className="text-flow w-6 h-6" />
        </View>
        <AppText variant="heading1" className="flex-1">
          {t('CREATE_TITLE')}
        </AppText>
      </View>

      <AppText variant="body" color="muted" className="mb-6" raw>
        {t('CREATE_SUBTITLE')}
      </AppText>

      {/* 🔗 Link — primary input, always visible */}
      <AppText variant="label" className="mb-1.5" raw>
        🔗 {t('CREATE_LINK_LABEL')}
      </AppText>
      <AppInput
        placeholder={t('CREATE_LINK_PLACEHOLDER')}
        value={link}
        onChangeText={txt => {
          setLink(txt);
          if (mode !== 'link') {
            setMode('link');
          }
          setValidationKey(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        leftIcon={<Icon name="Link" className="text-neutrals400 w-5 h-5" />}
      />

      {/* hoặc divider */}
      <View className="flex-row items-center gap-3 my-4">
        <View className="flex-1 h-px bg-neutrals900" />
        <AppText variant="bodySmall" color="muted" raw>
          {t('CREATE_OR')}
        </AppText>
        <View className="flex-1 h-px bg-neutrals900" />
      </View>

      {/* 📝 Dán text · 📎 Tải file — both visible, each "🔒 chỉ mình bạn" */}
      <View className="flex-row gap-3 mb-4">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{selected: mode === 'text'}}
          onPress={() => {
            setMode('text');
            setValidationKey(null);
          }}
          className={cn(
            'flex-1 items-center gap-1.5 py-4 px-3 rounded-2xl border',
            mode === 'text'
              ? 'bg-flowSoft border-flow'
              : 'bg-surface border-neutrals900',
          )}>
          <AppText variant="heading2" raw>
            📝
          </AppText>
          <AppText
            variant="bodySmall"
            weight="semibold"
            color={mode === 'text' ? 'primary' : 'default'}
            raw>
            {t('CREATE_TEXT_LABEL')}
          </AppText>
          <AppText variant="caption" color="muted" raw>
            {t('CREATE_PRIVATE_NOTE')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{selected: mode === 'file'}}
          onPress={() => {
            setMode('file');
            setValidationKey(null);
            if (!file) {
              handlePickFile();
            }
          }}
          className={cn(
            'flex-1 items-center gap-1.5 py-4 px-3 rounded-2xl border',
            mode === 'file'
              ? 'bg-flowSoft border-flow'
              : 'bg-surface border-neutrals900',
          )}>
          <AppText variant="heading2" raw>
            📎
          </AppText>
          <AppText
            variant="bodySmall"
            weight="semibold"
            color={mode === 'file' ? 'primary' : 'default'}
            raw>
            {t('CREATE_FILE_LABEL')}
          </AppText>
          <AppText variant="caption" color="muted" raw>
            {t('CREATE_PRIVATE_NOTE')}
          </AppText>
        </Pressable>
      </View>

      {/* Text mode reveals the textarea inline */}
      {mode === 'text' && (
        <AppInput
          label={t('CREATE_TEXT_LABEL')}
          placeholder={t('CREATE_TEXT_PLACEHOLDER')}
          helperText={t('CREATE_PRIVATE_NOTE')}
          value={text}
          onChangeText={txt => {
            setText(txt);
            setValidationKey(null);
          }}
          variant="textarea"
          numberOfLines={6}
          className="min-h-32"
        />
      )}

      {/* File mode shows the picked file + change affordance */}
      {mode === 'file' && file ? (
        <Pressable
          accessibilityRole="button"
          onPress={handlePickFile}
          className="flex-row items-center gap-3 border border-neutrals900 rounded-xl py-4 px-4">
          <Icon name="Paperclip" className="text-flow w-5 h-5" />
          <AppText variant="body" className="flex-1" raw>
            {t('CREATE_FILE_SELECTED', {name: file.name})}
          </AppText>
          <AppText variant="bodySmall" color="primary" raw>
            {t('CREATE_FILE_CHANGE')}
          </AppText>
        </Pressable>
      ) : null}

      {validationKey ? (
        <AppText variant="bodySmall" color="error" className="mt-2">
          {t(validationKey)}
        </AppText>
      ) : null}

      {/* Share-from-anywhere tip */}
      <View className="flex-row items-start gap-2.5 bg-warmSoft rounded-2xl px-4 py-3 my-4">
        <AppText variant="body" raw>
          💡
        </AppText>
        <AppText variant="bodySmall" className="flex-1 text-warmInk" weight="semibold" raw>
          {t('CREATE_SHARE_HINT')}
        </AppText>
      </View>

      {/* Remaining Creation Credits — shown before creating */}
      <View className="bg-neutrals1000 rounded-2xl px-5 py-4 mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <AppText variant="label" raw>
            {t('CREATE_CREDITS_LABEL')}
          </AppText>
          <AppText variant="label" color="primary" raw>
            {t('CREATE_CREDITS_COUNT', {
              remaining: creditsRemaining,
              total: creditsTotal,
            })}
          </AppText>
        </View>
        <ProgressBar
          variant="primary"
          value={creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0}
          animated
        />
        {!hasCredit ? (
          <AppText variant="bodySmall" color="warning" className="mt-3" raw>
            {t('CREATE_NO_CREDIT_BODY')}
          </AppText>
        ) : null}
      </View>

      <AppButton
        variant="primary"
        size="lg"
        disabled={!hasCredit || !hasInput}
        onPress={handleSubmit}>
        {t('CREATE_SUBMIT')}
      </AppButton>
    </ScrollView>
  );
}
