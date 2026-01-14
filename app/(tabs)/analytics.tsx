import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassEffectContainer, GlassView } from '../../components/GlassView';
import { Session, SessionRepository } from '../../repositories/SessionRepository';
import { useThemeStore } from '../../store/themeStore';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<Session[]>([]);
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';

  useEffect(() => {
    SessionRepository.getAllSessions().then(setSessions);
  }, []);

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration / 60), 0);
  const totalSessions = sessions.length;

  const StatCard = ({ label, value, icon, tint }: { label: string, value: string | number, icon: string, tint: string }) => (
    <GlassView style={styles.statCard} intensity={isDark ? 30 : 50}>
      <View style={styles.statContent}>
        <View style={[styles.iconBox, { backgroundColor: tint + '20' }]}>
          <SymbolView name={icon as any} tintColor={tint} size={24} />
        </View>
        <View>
          <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>{label}</Text>
        </View>
      </View>
    </GlassView>
  );

  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Statistics</Text>
        
        <GlassEffectContainer>
          <View style={styles.statsGrid}>
            <StatCard 
              label="Focus Minutes" 
              value={Math.round(totalMinutes)} 
              icon="flame.fill" 
              tint="#FF9500" 
            />
            <StatCard 
              label="Session Streak" 
              value={totalSessions} 
              icon="bolt.fill" 
              tint="#FFCC00" 
            />
          </View>

          <GlassView style={styles.mainCard} intensity={isDark ? 40 : 60}>
            <View style={styles.mainCardHeader}>
              <SymbolView name={"clock.badge.checkmark" as any} tintColor="#34C759" size={20} />
              <Text style={[styles.mainCardTitle, { color: textColor }]}>Focus Accomplishments</Text>
            </View>
            <View style={styles.accomplishmentRow}>
              <Text style={[styles.accomplishmentText, { color: textColor }]}>
                {totalSessions} productive sessions completed today.
              </Text>
            </View>
          </GlassView>
        </GlassEffectContainer>

        <Text style={[styles.subHeader, { color: secondaryTextColor }]}>ACTIVITY HISTORY</Text>
        {sessions.length === 0 ? (
          <GlassView style={styles.emptyState} intensity={20}>
            <Text style={{ color: secondaryTextColor, fontSize: 16 }}>No sessions recorded yet</Text>
          </GlassView>
        ) : (
          sessions.slice().reverse().map((s, i) => (
            <GlassView key={s.id} style={styles.historyCard} intensity={isDark ? 20 : 40}>
              <View style={styles.historyContent}>
                <View>
                  <Text style={[styles.historyTitle, { color: textColor }]}>
                    {s.type === 'focus' ? 'Focus Session' : 'Break'}
                  </Text>
                  <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                    {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.historyDuration, { color: textColor }]}>
                  {Math.round(s.duration / 60)}m
                </Text>
              </View>
            </GlassView>
          ))
        )}
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
    paddingBottom: 40,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: -1,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 12,
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statContent: {
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  mainCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  mainCardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  accomplishmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accomplishmentText: {
    fontSize: 15,
    opacity: 0.8,
  },
  historyCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 13,
    marginTop: 2,
  },
  historyDuration: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }
});
