import React from 'react';
import {Dimensions, Text, TouchableOpacity, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useColors} from '@/hooks/useColors.ts';
import {GraduationCap, Plus, User, Zap} from 'lucide-react-native';
import {AppText} from "@/components/ui";
import {useTranslation} from "react-i18next";

const {width: screenWidth} = Dimensions.get('window');

interface TabIconProps {
  name: string;
  color: string;
  size: number;
}

// Maps the four Inflow tab routes to their icons:
// Học · Tạo · Thử thách · Hồ sơ (docs/design/screens.md "Navigation model").
const TabIcon: React.FC<TabIconProps> = ({name, color, size}) => {
  switch (name) {
    case 'LEARN':
      return <GraduationCap size={size} color={color}/>;
    case 'CREATE':
      return <Plus size={size} color={color}/>;
    case 'CHALLENGE':
      return <Zap size={size} color={color}/>;
    case 'PROFILE':
      return <User size={size} color={color}/>;
    default:
      return <GraduationCap size={size} color={color}/>;
  }
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
                                                     state,
                                                     descriptors,
                                                     navigation
                                                   }) => {
  const colors = useColors();
  const {t} = useTranslation();

  return (
    <View
      className={'bg-background flex-row py-2 border-t border-neutrals900 pb-safe-offset-0'}
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

        const iconColor = isFocused
          ? colors.primary
          : colors.neutrals400;

        const labelColor = isFocused
          ? colors.primary
          : colors.neutrals400;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={.9}
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
              paddingVertical: 8,
              borderRadius: 12,
              marginHorizontal: 4,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <TabIcon
                name={route.name}
                color={iconColor}
                size={24}
              />
            </View>

            <AppText
              style={{
                color: labelColor,
                fontSize: 12,
                fontWeight: isFocused ? '600' : '400',
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
