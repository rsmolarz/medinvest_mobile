import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, layout, shadows } from '@/theme';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';

// Screens
import DiscoverScreen from '@/screens/main/DiscoverScreen';
import PortfolioScreen from '@/screens/main/PortfolioScreen';
import ResearchScreen from '@/screens/main/ResearchScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Animated pressable for tab bar items
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tab Bar Icon with animation
 */
interface TabIconProps {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  color: string;
}

function TabIcon({ name, focused, color }: TabIconProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name={name} size={24} color={color} />
    </Animated.View>
  );
}

/**
 * Custom Tab Bar with FAB
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // FAB animation
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  const handleFabPress = useCallback(() => {
    // Animate FAB
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
    fabRotation.value = withTiming(fabRotation.value + 360, { duration: 300 });

    // Navigate to invest modal
    rootNavigation.navigate('InvestModal');
  }, [fabScale, fabRotation, rootNavigation]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {/* Tab Bar Background */}
      <View style={styles.tabBarBackground}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Skip middle position for FAB
          const isLeftSide = index < 2;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Get icon name
          const iconName = getTabIcon(route.name);

          return (
            <AnimatedPressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                isLeftSide ? styles.tabButtonLeft : styles.tabButtonRight,
              ]}
            >
              <TabIcon
                name={iconName}
                focused={isFocused}
                color={isFocused ? colors.primary.main : colors.text.secondary}
              />
              {isFocused && <View style={styles.activeIndicator} />}
            </AnimatedPressable>
          );
        })}

        {/* FAB - Centered */}
        <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
          <Pressable onPress={handleFabPress} style={styles.fabPressable}>
            <LinearGradient
              colors={['#0066CC', '#00A86B'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <Feather name="plus" size={28} color={colors.text.inverse} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Get icon name for tab
 */
function getTabIcon(routeName: string): keyof typeof Feather.glyphMap {
  switch (routeName) {
    case 'Discover':
      return 'compass';
    case 'Portfolio':
      return 'pie-chart';
    case 'Research':
      return 'book-open';
    case 'Profile':
      return 'user';
    default:
      return 'circle';
  }
}

/**
 * Main Tab Navigator
 */
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portfolio',
        }}
      />
      <Tab.Screen
        name="Research"
        component={ResearchScreen}
        options={{
          tabBarLabel: 'Research',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  tabBarBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.lg,
  },
  
  // Tab buttons
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabButtonLeft: {
    marginRight: layout.fabSize / 2 + spacing.sm,
  },
  tabButtonRight: {
    marginLeft: layout.fabSize / 2 + spacing.sm,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.main,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -layout.fabSize / 2,
    bottom: 12,
  },
  fabPressable: {
    ...shadows.fab,
  },
  fab: {
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.fab,
  },
});
