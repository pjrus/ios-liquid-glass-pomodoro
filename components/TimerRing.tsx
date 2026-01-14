import React from 'react';
import { View, useColorScheme } from 'react-native';
import Animated, { Easing, useAnimatedProps, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerRingProps {
  progress: number; // 0 to 1
  size?: number;
}

export function TimerRing({ progress, size = 320 }: TimerRingProps) {
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - progress), {
      duration: 500,
      easing: Easing.bezier(0.33, 1, 0.68, 1), // Standard iOS-style ease-out
    }),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}
