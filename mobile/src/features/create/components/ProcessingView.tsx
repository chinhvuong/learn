import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {CreationStageKey, CreationStageStatus} from '../types';

/**
 * Processing transition (screens.md §13; ADR-0005 staged pipeline). The wait is
 * shown as the pipeline's real stages advancing — Lấy nội dung → Tìm
 * từ·chunk·NP → Dịch song ngữ → (audio) chuẩn bị nghe — so it reads as genuine
 * progress, not a spinner. `audioStage` is only shown for audio Sources.
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
}

function statusFor(index: number, active: number): CreationStageStatus {
  if (index < active) return 'done';
  if (index === active) return 'active';
  return 'pending';
}

function StageRow({label, status}: {label: string; status: CreationStageStatus}) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      {status === 'done' ? (
        <Icon name="Check" className="text-flow w-5 h-5" />
      ) : status === 'active' ? (
        <Icon name="LoaderCircle" className="text-flow w-5 h-5" />
      ) : (
        <Icon name="Circle" className="text-neutrals600 w-5 h-5" />
      )}
      <AppText
        variant="body"
        color={status === 'pending' ? 'muted' : 'default'}
        raw>
        {label}
      </AppText>
    </View>
  );
}

export default function ProcessingView({withAudio}: ProcessingViewProps) {
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
    <View className="flex-1 px-6 pt-10">
      <View className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-full bg-flowSoft items-center justify-center">
          <Icon name="Sparkles" className="text-flow w-6 h-6" />
        </View>
        <AppText variant="heading2">{t('PROCESSING_TITLE')}</AppText>
      </View>

      <View className="bg-neutrals1000 rounded-2xl px-5 py-3">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.key}
            label={t(stage.labelKey)}
            status={statusFor(i, active)}
          />
        ))}
      </View>

      <AppText variant="bodySmall" color="muted" className="mt-5" raw>
        {t('PROCESSING_CACHE_HINT')}
      </AppText>
    </View>
  );
}
