import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {AppText, Icon} from '@/components/ui';
import {CreationStageKey, CreationStageStatus} from '../types';

/**
 * Processing transition (design 13e `ReiP8`; screens.md §04; ADR-0005 staged
 * pipeline). The wait is shown as the pipeline's real stages advancing — Lấy
 * nội dung → Tìm từ · chunk · ngữ pháp → Dịch song ngữ → Chuẩn bị phần nghe — so
 * it reads as genuine progress, not a spinner. The audio-preparation stage is
 * only shown for audio Sources.
 */

interface Stage {
  key: CreationStageKey;
  labelKey: string;
}

const TEXT_STAGES: Stage[] = [
  {key: 'fetch', labelKey: 'PROCESSING_STAGE_FETCH'},
  {key: 'analyze', labelKey: 'PROCESSING_STAGE_ANALYZE'},
  {key: 'translate', labelKey: 'PROCESSING_STAGE_TRANSLATE'},
];

const AUDIO_STAGE: Stage = {
  key: 'audio',
  labelKey: 'PROCESSING_STAGE_AUDIO',
};

export interface ProcessingViewProps {
  /** Show the extra audio-preparation stage (audio Sources). */
  withAudio?: boolean;
  /** Source subtitle under the title, e.g. `"The Future of AI" · youtube.com`. */
  subtitle?: string;
}

function statusFor(index: number, active: number): CreationStageStatus {
  if (index < active) return 'done';
  if (index === active) return 'active';
  return 'pending';
}

/** A slow, continuous rotation for the active-stage loader glyph. */
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
      <Icon name="LoaderCircle" className="text-flow w-6 h-6" />
    </Animated.View>
  );
}

function StepRow({
  label,
  status,
}: {
  label: string;
  status: CreationStageStatus;
}) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  return (
    <View
      className={
        isActive
          ? 'flex-row items-center gap-3 rounded-xl border-[1.5px] border-flow bg-flow-soft p-3.5'
          : isDone
            ? 'flex-row items-center gap-3 rounded-xl border border-border bg-surface p-3.5'
            : 'flex-row items-center gap-3 rounded-xl border border-border bg-surface p-3.5 opacity-60'
      }>
      {isDone ? (
        <View className="w-6 h-6 rounded-full bg-flow items-center justify-center">
          <Icon name="Check" className="text-on-flow w-3.5 h-3.5" />
        </View>
      ) : isActive ? (
        <Spinner />
      ) : (
        <View className="w-6 h-6 rounded-full border-2 border-border bg-surface" />
      )}
      <AppText
        variant="body"
        weight={isActive ? 'semibold' : 'regular'}
        color={isActive ? 'primary' : status === 'pending' ? 'muted' : 'default'}
        className="flex-1 text-sm"
        raw>
        {label}
      </AppText>
    </View>
  );
}

export default function ProcessingView({
  withAudio,
  subtitle,
}: ProcessingViewProps) {
  const {t} = useTranslation();
  const stages = withAudio ? [...TEXT_STAGES, AUDIO_STAGE] : TEXT_STAGES;
  const [active, setActive] = useState(0);

  // Advance the staged pipeline visually while the request is in flight.
  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => Math.min(prev + 1, stages.length - 1));
    }, 450);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <View className="flex-1 px-4 pt-2 gap-[18px]">
      {/* Header block — ring + title + Source */}
      <View className="items-center gap-3 px-2 py-[18px]">
        <View className="w-[66px] h-[66px] rounded-full bg-flow-soft border-[3px] border-flow items-center justify-center">
          <Icon name="Zap" className="text-warm w-7 h-7" />
        </View>
        <AppText variant="heading3" align="center" className="text-lg" raw>
          {t('PROCESSING_TITLE')}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color="muted" align="center" raw>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {/* Steps */}
      <View className="gap-2.5">
        {stages.map((stage, i) => {
          const status = statusFor(i, active);
          const label =
            status === 'active' ? `${t(stage.labelKey)}…` : t(stage.labelKey);
          return <StepRow key={stage.key} label={label} status={status} />;
        })}
      </View>

      {/* Warm reassurance — leaving is fine, we'll notify */}
      <View className="bg-warm-soft rounded-xl p-3.5">
        <AppText variant="bodySmall" className="text-warm-ink text-sm" raw>
          {t('PROCESSING_WARM_HINT')}
        </AppText>
      </View>

      <View className="flex-1" />

      <View className="items-center">
        <AppText
          variant="bodySmall"
          color="muted"
          align="center"
          className="text-sm"
          raw>
          {t('PROCESSING_CACHE_HINT')}
        </AppText>
      </View>
    </View>
  );
}
