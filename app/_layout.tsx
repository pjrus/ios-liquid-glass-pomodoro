import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance, StyleSheet, View, useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme, _hasHydrated } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  useEffect(() => {
    if (_hasHydrated) {
      SystemUI.setBackgroundColorAsync(backgroundColor);
      Appearance.setColorScheme(isDark ? 'dark' : 'light');
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated, backgroundColor, isDark]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
