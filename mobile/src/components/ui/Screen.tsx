import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {Edge, SafeAreaView} from 'react-native-safe-area-context';
import {cn} from '@/utils';
import {screenLayout} from '@/config/layout';

interface ScreenProps extends ViewProps {
  /** Render the content inside a vertical ScrollView. */
  scroll?: boolean;
  /** Apply the canonical horizontal gutter + top padding. Default true. */
  padded?: boolean;
  /** Centre content on both axes (empty / placeholder states). */
  center?: boolean;
  /** Safe-area edges to inset. Default `['top']` — the tab bar owns the bottom. */
  edges?: readonly Edge[];
  /** Extra style for the scrolling content container (scroll mode only). */
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Pinned footer rendered outside the scroll area (e.g. a primary CTA). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The canonical screen scaffold for Inflow.
 *
 * Recreates the design.pen screen envelope (PhoneShell `saexg` → Screen): an
 * `$app-bg` canvas inset by the device safe areas, with the shared content
 * gutter and rhythm from `screenLayout` (config/layout.ts). Every full-screen
 * destination should compose this instead of re-deriving SafeAreaView + padding,
 * so the chrome (TabBar, status bar inset, gutter) stays consistent app-wide.
 *
 * Colours come from tokens (`bg-app-bg`) so it re-themes light/dark for free.
 */
export default function Screen({
  scroll = false,
  padded = true,
  center = false,
  edges = ['top'],
  contentContainerStyle,
  footer,
  children,
  className,
  style,
  ...rest
}: ScreenProps) {
  const paddingStyle: ViewStyle = padded
    ? {
        paddingHorizontal: screenLayout.paddingHorizontal,
        paddingTop: screenLayout.paddingTop,
      }
    : {};

  const centerStyle: ViewStyle = center
    ? {flexGrow: 1, alignItems: 'center', justifyContent: 'center'}
    : {};

  return (
    <SafeAreaView
      edges={edges}
      className={cn('flex-1 bg-app-bg', className)}
      style={style}
      {...rest}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            paddingStyle,
            {paddingBottom: screenLayout.paddingBottom},
            centerStyle,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{flex: 1}, paddingStyle, centerStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

Screen.displayName = 'Screen';
