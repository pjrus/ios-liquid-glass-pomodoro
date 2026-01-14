import { BlurView } from 'expo-blur';
import React from 'react';
import { AccessibilityInfo, StyleProp, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  glassEffectStyle?: 'regular' | 'prominent' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial';
  isInteractive?: boolean;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function GlassView({ 
  children, 
  style, 
  intensity = 50, 
  glassEffectStyle = 'regular',
  isInteractive = false 
}: GlassViewProps) {
  const [reduceTransparency, setReduceTransparency] = React.useState(false);
  const scale = useSharedValue(1);
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();

  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  React.useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    );
    return () => subscription.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInteractive) {
      scale.value = withTiming(0.98, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (isInteractive) {
      scale.value = withTiming(1, { duration: 150 });
    }
  };

  if (reduceTransparency) {
    return (
      <View style={[
        styles.fallback, 
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderWidth: StyleSheet.hairlineWidth,
        },
        style
      ]}>
        {children}
      </View>
    );
  }

  const tint = isDark ? 'dark' : 'light';
  
  return (
    <AnimatedBlurView
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.4)' : 'rgba(255, 255, 255, 0.3)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
          borderWidth: 0.5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 5,
        },
        style, 
        animatedStyle
      ]}
      intensity={intensity}
      tint={tint}
      onTouchStart={isInteractive ? handlePressIn : undefined}
      onTouchEnd={isInteractive ? handlePressOut : undefined}
    >
      {children}
    </AnimatedBlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallback: {
    overflow: 'hidden',
  },
  effectContainer: {
  },
});

export const GlassEffectContainer = ({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.effectContainer, style]}>
    {children}
  </View>
);
