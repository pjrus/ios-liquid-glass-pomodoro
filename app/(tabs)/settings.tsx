import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { ThemeType, useThemeStore } from '../../store/themeStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const { theme, setTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';

  const handleThemeChange = (newTheme: ThemeType) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
  };

  const ThemeRow = ({ label, value, icon }: { label: string, value: ThemeType, icon: string }) => (
    <Pressable onPress={() => handleThemeChange(value)}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <SymbolView name={icon as any} tintColor={textColor} size={20} />
          <Text style={[styles.rowText, { color: textColor }]}>{label}</Text>
        </View>
        {theme === value && (
          <SymbolView name={"checkmark" as any} tintColor="#007AFF" size={18} />
        )}
      </View>
    </Pressable>
  );

  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Settings</Text>
        
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>APPEARANCE</Text>
        <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
          <ThemeRow label="Light" value="light" icon="sun.max.fill" />
          <View style={styles.separator} />
          <ThemeRow label="Dark" value="dark" icon="moon.fill" />
          <View style={styles.separator} />
          <ThemeRow label="System" value="system" icon="iphone" />
        </GlassView>

        <View style={{ marginTop: 30 }}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>TIMER</Text>
          <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
             <View style={styles.row}>
               <Text style={[styles.rowText, { color: textColor }]}>Focus Duration</Text>
               <Text style={{ color: secondaryTextColor }}>25 min</Text>
             </View>
          </GlassView>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>ABOUT</Text>
          <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
             <View style={styles.row}>
               <Text style={[styles.rowText, { color: textColor }]}>Version</Text>
               <Text style={{ color: secondaryTextColor }}>1.0.0 (iOS 26)</Text>
             </View>
          </GlassView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    letterSpacing: -1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  row: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 54,
  },
});
