import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useColors} from '@/hooks/useColors';

/**
 * Falling confetti — the React Native recreation of the handoff's `confettiFall`
 * keyframe (`#core` Celebration / `#profile` Level up): square/round chips that
 * fall from the top, fading in then out, on staggered loops.
 *
 *   @keyframes confettiFall { 0% { translateY(-12) rotate(0); opacity:0 }
 *     12% { opacity:1 } 100% { translateY(360) rotate(420deg); opacity:0 } }
 *
 * Colors come from the token families used in the design — `warm` (amber) and
 * `flow` (teal) and their `*Ink`/`Press` variants — never hardcoded.
 */
export interface ConfettiProps {
  /** Pause the animation (e.g. when off-screen) — defaults to running. */
  active?: boolean;
}

interface Piece {
  left: string;
  size: number;
  round: boolean;
  duration: number;
  delay: number;
  colorKey: 'warm' | 'flow' | 'warmInk' | 'flowPress' | 'flowInk';
}

// Mirrors the confetti chips in the handoff (left %, size, color, duration/delay).
const PIECES: Piece[] = [
  {left: '12%', size: 9, round: false, duration: 2600, delay: 0, colorKey: 'warm'},
  {left: '26%', size: 7, round: false, duration: 3100, delay: 400, colorKey: 'flow'},
  {left: '40%', size: 10, round: false, duration: 2400, delay: 800, colorKey: 'warmInk'},
  {left: '55%', size: 8, round: false, duration: 2900, delay: 200, colorKey: 'flowPress'},
  {left: '68%', size: 9, round: false, duration: 3300, delay: 600, colorKey: 'warm'},
  {left: '82%', size: 7, round: false, duration: 2700, delay: 1000, colorKey: 'flow'},
  {left: '90%', size: 9, round: true, duration: 3000, delay: 300, colorKey: 'warmInk'},
  {left: '34%', size: 9, round: true, duration: 3400, delay: 1100, colorKey: 'flowInk'},
  {left: '60%', size: 8, round: true, duration: 3200, delay: 1400, colorKey: 'warm'},
];

function ConfettiPiece({piece, active}: {piece: Piece; active: boolean}) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim, piece.duration, piece.delay]);

  const style = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 360],
        }),
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '420deg'],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.12, 1],
      outputRange: [0, 1, 0],
    }),
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute' as const,
          top: -10,
          left: piece.left as unknown as number,
          width: piece.size,
          height: piece.size,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: colors[piece.colorKey],
        },
        style,
      ]}
    />
  );
}

export default function Confetti({active = true}: ConfettiProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIECES.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} active={active} />
      ))}
    </View>
  );
}

Confetti.displayName = 'Confetti';
