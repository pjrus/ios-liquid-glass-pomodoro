/**
 * Root Layout - App Entry Point & Theme Provider
 * 
 * This is the top-level layout component that wraps the entire application.
 * It serves as the central point for:
 * 
 * 1. THEME SYSTEM INTEGRATION
 *    - Provides React Navigation theme context via ThemeProvider
 *    - Ensures all navigation components (headers, tabs) use correct colors
 *    - Synchronizes with Zustand-persisted theme preference
 * 
 * 2. SPLASH SCREEN MANAGEMENT
 *    - Prevents splash screen from auto-hiding
 *    - useAppTheme hook controls when to reveal the app
 *    - Ensures user never sees incorrect theme during load
 * 
 * 3. STATUS BAR STYLING
 *    - Dynamically adjusts status bar to match current theme
 *    - Light icons on dark background, dark icons on light background
 * 
 * 4. BACKGROUND COLOR CONSISTENCY
 *    - Applies themed background to both container View and Stack
 *    - Prevents any white flashes during screen transitions
 * 
 * ARCHITECTURE NOTE:
 * The theme loading logic is intentionally delegated to useAppTheme hook
 * to keep this layout component focused on structure. The hook handles:
 * - AsyncStorage hydration
 * - Native system UI synchronization
 * - Splash screen dismissal timing
 * 
 * @see useAppTheme for theme synchronization details
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

/**
 * CRITICAL: Prevent splash screen from auto-hiding
 * 
 * This MUST be called before component renders. The splash screen remains
 * visible until useAppTheme calls SplashScreen.hideAsync() after theme loads.
 * Without this, users would see a flash of incorrect theme colors.
 */
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Delegate theme resolution and synchronization to custom hook
  // This hook also manages splash screen visibility
  const { isDark, backgroundColor } = useAppTheme();

  return (
    // ThemeProvider gives React Navigation access to theme colors
    // Used by navigation elements like headers, tab bars, etc.
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/* Container View ensures consistent background during transitions */}
      <View style={[styles.container, { backgroundColor }]}>
        {/* Status bar icons adapt to theme for visibility */}
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            // Apply background to stack content to prevent white gaps
            contentStyle: { backgroundColor }
          }}
        >
          {/* Main tab navigation - headerShown: false since tabs have own header */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Task Detail Modal - presented as a form sheet on iOS */}
          <Stack.Screen 
            name="task/[id]" 
            options={{ 
              presentation: 'formSheet',
              sheetAllowedDetents: [1.0], 
              headerShown: false 
            }} 
          />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
