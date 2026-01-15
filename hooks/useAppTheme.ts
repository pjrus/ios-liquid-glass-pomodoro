import { SplashScreen } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export function useAppTheme() {
  const { theme, hasLoaded } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  // Resolve the current theme: explicit 'dark'/'light' or fallback to system
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';
  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  useEffect(() => {
    if (hasLoaded) {
      // 1. Synchronize the native root view background to prevent white flashes
      SystemUI.setBackgroundColorAsync(backgroundColor);

      // 2. Force React Native appearance context to match internal theme
      Appearance.setColorScheme(isDark ? 'dark' : 'light');

      // 3. Dismiss splash screen only after theme is applied
      SplashScreen.hideAsync();
    }
  }, [hasLoaded, backgroundColor, isDark]);

  return {
    isDark,
    backgroundColor,
    isReady: hasLoaded,
  };
}
