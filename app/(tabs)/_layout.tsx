import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { DynamicColorIOS, useColorScheme } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const tintColor = theme === 'system'
    ? DynamicColorIOS({ dark: 'white', light: 'black' })
    : (isDark ? 'white' : 'black');

  return (
    <NativeTabs
      labelStyle={{
        color: tintColor,
      }}
      tintColor={tintColor}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Label>Timer</Label>
        <Icon sf={{ default: 'timer', selected: 'timer' }} />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="analytics" role="search">
        <Label>Analytics</Label>
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
