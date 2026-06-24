import React from 'react';
import {View} from 'react-native';

interface OnboardingProgressProps {
  /** Total step bars. */
  total: number;
  /** 1-based index of the current step (bars up to this are filled). */
  current: number;
}

/**
 * The segmented step indicator at the top of the onboarding screens (handoff
 * screens 02/03 — a row of bars, `--flow` filled vs `--hair`). Filled bars use
 * the teal `--flow` token; the rest use the hairline token.
 */
export default function OnboardingProgress({total, current}: OnboardingProgressProps) {
  return (
    <View className="flex-row gap-1.5 mb-6">
      {Array.from({length: total}).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < current ? 'bg-flow' : 'bg-hair'}`}
        />
      ))}
    </View>
  );
}
