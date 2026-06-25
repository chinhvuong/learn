import React from 'react';
import {View, ViewStyle} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useColors} from '@/hooks/useColors.ts';

interface InflowLogoProps {
  /** Side length of the rounded tile, in px. */
  size?: number;
  /** Corner radius of the tile. Design uses ~0.29×size (18px on a 62px tile). */
  radius?: number;
  style?: ViewStyle;
}

/**
 * The Inflow brand mark: two stacked "flow" waves on a teal-gradient rounded
 * square (design handoff — the logo SVG at Inflow.dc.html lines 86 / 204 / 439).
 *
 * Recreated as a vector per the handoff ("recreate as a vector asset"), not the
 * Lucide placeholder the onboarding/auth screens shipped with. The wave path
 * data is copied verbatim from the design (viewBox 0 0 20 20).
 */
export default function InflowLogo({size = 62, radius, style}: InflowLogoProps) {
  const colors = useColors();
  const r = radius ?? Math.round(size * 0.29);
  const rx = (r / size) * 20; // tile radius expressed in the 0–20 viewBox units
  const wave = size * (20 / 34); // design draws a 20-unit glyph in a 34px box

  return (
    <View
      // Outer view carries the teal drop shadow (no clip so the shadow shows).
      style={[
        {
          shadowColor: colors.flow,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: {width: 0, height: 8},
          elevation: 6,
        },
        style,
      ]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Svg width={size} height={size} viewBox="0 0 20 20" style={{position: 'absolute'}}>
          <Defs>
            <LinearGradient id="inflowFlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.flow} />
              <Stop offset="1" stopColor={colors.flowPress} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={20} height={20} rx={rx} ry={rx} fill="url(#inflowFlow)" />
        </Svg>
        <Svg width={wave} height={wave} viewBox="0 0 20 20" fill="none">
          <Path
            d="M2.6 7c2-2.4 4.1-2.4 6.1 0s4.1 2.4 6.1 0"
            stroke={colors.onFlow}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.95}
          />
          <Path
            d="M3.2 12.4c2-2.4 4-2.4 6 0s4 2.4 6 0"
            stroke={colors.onFlow}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.6}
          />
        </Svg>
      </View>
    </View>
  );
}

InflowLogo.displayName = 'InflowLogo';
