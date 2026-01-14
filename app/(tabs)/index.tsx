import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GlassEffectContainer, GlassView } from '../../components/GlassView';
import { TimerRing } from '../../components/TimerRing';
import { SessionRepository } from '../../repositories/SessionRepository';
import { useThemeStore } from '../../store/themeStore';
import { useTimerStore } from '../../store/timerStore';

export default function TimerScreen() {
  const { isRunning, startTime, duration, startTimer, stopTimer } = useTimerStore();
  const [timeLeft, setTimeLeft] = useState(duration);
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

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
  const formattedTime = `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${Math.floor(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <GlassEffectContainer style={StyleSheet.absoluteFill}>
        <View style={[
          styles.gradientPlaceholder, 
          { backgroundColor: isDark ? '#3b82f6' : '#60a5fa', opacity: isDark ? 0.3 : 0.15 }
        ]} />
      </GlassEffectContainer>

      <GlassView style={styles.card} intensity={isDark ? 40 : 60} glassEffectStyle="regular">
        <View style={styles.timerContainer}>
          <TimerRing progress={progress} />
          <Text style={[styles.timeText, { color: isDark ? '#fff' : '#000' }]}>{formattedTime}</Text>
        </View>
      </GlassView>

      <Pressable onPress={toggleTimer} style={styles.buttonContainer}>
        <GlassView style={styles.button} intensity={isDark ? 60 : 80} isInteractive>
          <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#000' }]}>{isRunning ? "Pause" : "Start Focus"}</Text>
        </GlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientPlaceholder: {
    flex: 1,
  },
  card: {
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    position: 'absolute',
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  buttonContainer: {
    marginTop: 50,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
