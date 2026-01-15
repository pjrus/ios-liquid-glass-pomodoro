import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { TimerRing } from '../../components/TimerRing';
import { SessionRepository } from '../../repositories/SessionRepository';
import { useThemeStore } from '../../store/themeStore';
import { useTimerStore } from '../../store/timerStore';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const { isRunning, startTime, duration, startTimer, stopTimer, timerMode, setTimerMode, activeProfileId, profiles, setActiveProfile } = useTimerStore();
  const [timeLeft, setTimeLeft] = useState(duration);
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Core timer loop: handles countdown, session completion, and auto-switching between Focus/Break modes
  const isCompletingRef = React.useRef(false);

  // Reset guard when timer restarts
  useEffect(() => {
    if (isRunning) {
        isCompletingRef.current = false;
    }
  }, [isRunning, startTime]);

  useEffect(() => {
    let interval: any;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0 && !isCompletingRef.current) {
          isCompletingRef.current = true; // Lock immediately
          stopTimer();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (startTime && timerMode === 'focus') {
             // Only save session for focus work
              SessionRepository.saveSession({
                id: Math.random().toString(36).substr(2, 9),
                startTime: startTime,
                duration: duration,
                completedAt: Date.now(),
                type: 'focus',
              });
          }

          // Switch mode
          if (timerMode === 'focus') {
              setTimerMode('break');
          } else {
              setTimerMode('focus');
          }
        }
      }, 100);
    } else {
      setTimeLeft(duration);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, duration, stopTimer, timerMode, setTimerMode]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  // Switch active profile only when the timer is not running
  const handleProfileSelect = (id: string) => {
      if (isRunning) return; // Prevent switching while running for simplicity
      setActiveProfile(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = 1 - (timeLeft / duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;


  const buttonLabel = isRunning 
    ? "Pause" 
    : (timerMode === 'focus' ? "Start Focus" : "Start Break");

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      
      <View style={styles.profileSelectorContainer}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.profileSelectorContent}
        >
            {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                    <Pressable 
                        key={profile.id} 
                        onPress={() => handleProfileSelect(profile.id)}
                        disabled={isRunning}
                        style={{ opacity: isRunning ? 0.5 : 1 }}
                    >
                        <GlassView 
                            intensity={isActive ? (isDark ? 80 : 90) : (isDark ? 20 : 40)}
                            style={[
                                styles.profilePill,
                                isActive && { borderColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }
                            ]}
                        >
                            <Text style={[
                                styles.profilePillText, 
                                { color: isActive ? textColor : secondaryTextColor, fontWeight: isActive ? '600' : '400' }
                            ]}>
                                {profile.name}
                            </Text>
                        </GlassView>
                    </Pressable>
                );
            })}
        </ScrollView>
      </View>

      <GlassView 
        style={styles.timerCard} 
        intensity={80}
        glassEffectStyle="regular"
      >
        <View style={styles.contentContainer}>
          <TimerRing progress={progress} size={280} />
          <View style={styles.timeWrapper}>
             <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modeText, { color: secondaryTextColor }]}>{activeProfile.name}</Text>
                {timerMode === 'focus' && (
                    <Text style={[styles.durationText, { color: secondaryTextColor }]}>
                        {activeProfile.workDuration}/{activeProfile.breakDuration}
                    </Text>
                )}
             </View>
             <Text style={[
                styles.timeText, 
                { color: textColor },
                Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }
             ]}>
                {formattedTime}
             </Text>
          </View>
        </View>
      </GlassView>

      <View style={styles.controls}>
        <Pressable onPress={toggleTimer}>
          <GlassView 
            style={styles.controlPill} 
            intensity={isDark ? 60 : 80} 
            isInteractive
          >
            <Text style={[styles.controlText, { color: textColor }]}>
              {buttonLabel}
            </Text>
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center' removed to allow custom spacing
  },
  profileSelectorContainer: {
      height: 60,
      width: '100%',
      marginTop: 20,
      marginBottom: 20,
  },
  profileSelectorContent: {
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 12,
  },
  profilePill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
  },
  profilePillText: {
      fontSize: 14,
  },
  timerCard: {
    width: 320,
    height: 320,
    borderRadius: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeWrapper: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -1,
    lineHeight: 80, // Adjust layout
  },
  modeText: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 0,
      textAlign: 'center',
      maxWidth: 240,
  },
  durationText: {
      fontSize: 12,
      fontWeight: '500',
      opacity: 0.7,
      marginTop: 2,
      textAlign: 'center',
  },
  controls: {
    marginTop: 60,
  },
  controlPill: {
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});
