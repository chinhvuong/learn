import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useColors} from '@/hooks/useColors.ts';
import {Home, Plus, User, Zap} from 'lucide-react-native';
import {AppText} from "@/components/ui";
import {useTranslation} from "react-i18next";

interface TabIconProps {
  name: string;
  color: string;
  size: number;
  /** Active tabs carry a marginally heavier stroke in the handoff (2 vs 1.8). */
  strokeWidth: number;
}

const TabIcon: React.FC<TabIconProps> = ({name, color, size, strokeWidth}) => {
  switch (name) {
    case 'Learn':
      return <Home size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Create':
      return <Plus size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Challenge':
      return <Zap size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Profile':
      return <User size={size} color={color} strokeWidth={strokeWidth}/>;
    default:
      return <Home size={size} color={color} strokeWidth={strokeWidth}/>;
  }
};

/**
 * Inflow bottom tab bar — Học · Tạo · Thử thách · Hồ sơ.
 *
 * Recreated from the design handoff tab chrome (the `#core`/`#create`/`#profile`
 * phone frames in Inflow.dc.html):
 *   - container: `var(--app-bg)` fill, 1px `var(--hair)` top hairline, padding
 *     9px / 12px / 6px (plus the bottom safe-area inset).
 *   - active tab = `--flow-ink` (teal ink), inactive = `--ink-3`.
 *   - icon 23px, label 10.5px, 3px icon→label gap; active label weight 700,
 *     inactive 600. Active icons use a slightly heavier stroke.
 * All colors come from the active Inflow token set (useColors), so light/dark
 * re-theme automatically — nothing hardcoded.
 *
 * `title` holds an i18n key; it is run through `t()` so labels render as
 * Vietnamese product copy and follow language changes.
 */
const CustomTabBar: React.FC<BottomTabBarProps> = ({
                                                     state,
                                                     descriptors,
                                                     navigation
                                                   }) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();

  return (
    <View
      className={'bg-app-bg flex-row border-t border-hair'}
      style={{
        paddingTop: 9,
        paddingHorizontal: 12,
        paddingBottom: 6 + insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Active = teal ink (--flow-ink), inactive = tertiary ink (--ink-3).
        const tintColor = isFocused ? colors.flowInk : colors.ink3;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <TabIcon
              name={route.name}
              color={tintColor}
              size={23}
              strokeWidth={isFocused ? 2 : 1.8}
            />
            <AppText
              style={{
                color: tintColor,
                fontSize: 10.5,
                fontWeight: isFocused ? '700' : '600',
                textAlign: 'center',
              }}
            >
              {t(label as string)}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
