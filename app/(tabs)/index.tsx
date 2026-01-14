import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { TimerRing } from '../../components/TimerRing';
import { SessionRepository } from '../../repositories/SessionRepository';
import { useThemeStore } from '../../store/themeStore';
import { useTimerStore } from '../../store/timerStore';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const { isRunning, startTime, duration, startTimer, stopTimer } = useTimerStore();
  const [timeLeft, setTimeLeft] = useState(duration);
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  useEffect(() => {
    let interval: any;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          stopTimer();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (startTime) {
              SessionRepository.saveSession({
                id: Math.random().toString(36).substr(2, 9),
                startTime: startTime,
                duration: duration,
                completedAt: Date.now(),
                type: 'focus',
              });
          }
        }
      }, 100);
    } else {
      setTimeLeft(duration);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, duration, stopTimer]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const progress = 1 - (timeLeft / duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <GlassView 
        style={styles.timerCard} 
        intensity={80}
        glassEffectStyle="regular"
      >
        <View style={styles.contentContainer}>
          <TimerRing progress={progress} size={280} />
          <Text style={[
            styles.timeText, 
            { color: textColor },
            Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }
          ]}>
            {formattedTime}
          </Text>
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
              {isRunning ? "Pause" : "Start Focus"}
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
    justifyContent: 'center',
    alignItems: 'center',
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
  timeText: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -1,
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
