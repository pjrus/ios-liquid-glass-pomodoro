import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GlassView } from '../../components/GlassView';
import { ThemeType, useThemeStore } from '../../store/themeStore';

export default function SettingsScreen() {
  const { theme, setTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

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
          <SymbolView name={icon as any} tintColor={isDark ? '#fff' : '#000'} size={20} />
          <Text style={[styles.rowText, { color: isDark ? '#fff' : '#000' }]}>{label}</Text>
        </View>
        {theme === value && (
          <SymbolView name={"checkmark" as any} tintColor="#3b82f6" size={18} />
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <Text style={[styles.header, { color: isDark ? '#fff' : '#000' }]}>Settings</Text>
      
      <Text style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#636366' }]}>APPEARANCE</Text>
      <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
        <ThemeRow label="Light" value="light" icon="sun.max.fill" />
        <View style={styles.separator} />
        <ThemeRow label="Dark" value="dark" icon="moon.fill" />
        <View style={styles.separator} />
        <ThemeRow label="System" value="system" icon="iphone" />
      </GlassView>

      <View style={{ marginTop: 30 }}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#636366' }]}>TIMER</Text>
        <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
           <View style={styles.row}>
             <Text style={[styles.rowText, { color: isDark ? '#fff' : '#000' }]}>Focus Duration</Text>
             <Text style={{ color: '#8E8E93' }}>25 min</Text>
           </View>
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 17,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginLeft: 54,
  },
});
