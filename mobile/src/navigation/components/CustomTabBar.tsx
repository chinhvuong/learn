import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useColors} from '@/hooks/useColors.ts';
import {House, SquarePlus, User, Zap} from 'lucide-react-native';
import {AppText} from '@/components/ui';
import {useTranslation} from 'react-i18next';

interface TabIconProps {
  name: string;
  color: string;
  size: number;
  strokeWidth: number;
}

/**
 * Tab glyphs, matched to the design.pen TabBar (`xzXcl`) lucide icons:
 * Học = `house`, Tạo = `square-plus`, Thử thách = `zap`, Hồ sơ = `user`.
 */
const TabIcon: React.FC<TabIconProps> = ({name, color, size, strokeWidth}) => {
  switch (name) {
    case 'Learn':
      return <House size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Create':
      return <SquarePlus size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Challenge':
      return <Zap size={size} color={color} strokeWidth={strokeWidth}/>;
    case 'Profile':
      return <User size={size} color={color} strokeWidth={strokeWidth}/>;
    default:
      return <House size={size} color={color} strokeWidth={strokeWidth}/>;
  }
};

/**
 * Inflow bottom tab bar — Học · Tạo · Thử thách · Hồ sơ.
 *
 * Pixel-matched to the design.pen TabBar (`xzXcl`):
 *   - container: `$app-bg` fill, 1px `$hair` top hairline, padding 9/12/6/12
 *     (top/right/bottom/left) plus the bottom safe-area inset.
 *   - tab cell: vertical, centered, 3px icon→label gap, fills equal width.
 *   - icon 23px; label `font-ui` 10.5px.
 *   - active = `$flow-ink` (teal ink) + label weight 700; inactive = `$ink-3`
 *     + label weight 600. Active/inactive share the same icon stroke (the pen
 *     differentiates by colour and label weight only).
 *
 * All colours come from the active Inflow token set (`useColors`), so the bar
 * re-themes for light/dark with nothing hardcoded. Labels are run through `t()`
 * so they render as Vietnamese product copy and follow language changes.
 */
const CustomTabBar: React.FC<BottomTabBarProps> = ({
                                                     state,
                                                     descriptors,
                                                     navigation,
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
              strokeWidth={2}
            />
            <AppText
              raw
              weight={isFocused ? 'bold' : 'semibold'}
              style={{
                color: tintColor,
                fontSize: 10.5,
                lineHeight: 13,
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
