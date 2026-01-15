/**
 * useAppTheme Hook - Theme Synchronization & Splash Screen Management
 * 
 * This hook is critical for preventing "white flash" issues in dark mode.
 * 
 * THE PROBLEM:
 * When the app starts, React Native initially renders with the system theme.
 * If the user has saved a different theme preference (e.g., dark mode when system
 * is light), there's a visible flash as the UI re-renders with the correct theme.
 * 
 * THE SOLUTION:
 * This hook coordinates three systems to ensure smooth theme initialization:
 * 
 * 1. SPLASH SCREEN (expo-splash-screen)
 *    - Prevents auto-hiding until theme is ready
 *    - User sees splash screen instead of incorrect theme
 * 
 * 2. SYSTEM UI (expo-system-ui)
 *    - Sets the native root view background color
 *    - Prevents white flash behind React content
 * 
 * 3. APPEARANCE API (React Native)
 *    - Forces RN's color scheme context to match saved preference
 *    - Ensures useColorScheme() returns correct value app-wide
 * 
 * EXECUTION ORDER:
 * 1. App starts → splash screen visible (SplashScreen.preventAutoHideAsync in _layout)
 * 2. Zustand hydrates theme from AsyncStorage → hasLoaded becomes true
 * 3. This effect runs → sets background, appearance, then hides splash
 * 4. User sees correctly themed UI with no flash
 * 
 * @returns Object containing theme state and readiness flag
 */

import { SplashScreen } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export function useAppTheme() {
  // Get persisted theme preference and hydration status from Zustand store
  const { theme, hasLoaded } = useThemeStore();
  
  // Get current system theme for 'system' preference mode
  const systemColorScheme = useColorScheme();
  
  /**
   * Theme Resolution Logic
   * 
   * Priority: User preference > System default
   * - 'dark' or 'light': Use explicitly set theme
   * - 'system': Follow device's current color scheme
   */
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';
  const backgroundColor = isDark ? '#000000' : '#F2F2F7'; // iOS-standard background colors

  /**
   * Theme Synchronization Effect
   * 
   * Only runs after Zustand has hydrated the persisted theme.
   * Executes three critical operations in sequence:
   */
  useEffect(() => {
    if (hasLoaded) {
      // Step 1: Set native root view background
      // This prevents white showing through during navigation transitions
      SystemUI.setBackgroundColorAsync(backgroundColor);

      // Step 2: Force React Native's appearance context
      // This ensures all components using useColorScheme() get the correct value,
      // even if it differs from the device's system setting
      Appearance.setColorScheme(isDark ? 'dark' : 'light');

      // Step 3: Hide splash screen after theme is fully applied
      // User now sees correctly themed content with no flash
      SplashScreen.hideAsync();
    }
  }, [hasLoaded, backgroundColor, isDark]);

  return {
    /** Whether dark mode is active */
    isDark,
    /** Current background color (black for dark, #F2F2F7 for light) */
    backgroundColor,
    /** Whether theme has loaded from storage */
    isReady: hasLoaded,
  };
}
