import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const activeTintColor = isDark ? '#FFFFFF' : '#007AFF';

  return (
    <NativeTabs
      // @ts-ignore: Hypothetical prop in some versions, but we'll stick to what works
      tabBarStyle={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderTopWidth: 0,
      }}
      tintColor={activeTintColor}
      labelStyle={{
        color: activeTintColor,
      }}
      // @ts-ignore
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Label>Timer</Label>
        <Icon sf={{ default: 'timer', selected: 'timer' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="analytics">
        <Label>Stats</Label>
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <Label>Tasks</Label>
        <Icon sf={{ default: 'checklist', selected: 'checklist' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
