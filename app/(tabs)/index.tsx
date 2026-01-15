/**
 * TimerScreen - Main Pomodoro Timer Interface
 * 
 * This is the primary screen of the app where users interact with the timer.
 * It handles:
 * - Timer countdown logic with precise timing
 * - Audio playback for ambient sounds during focus sessions
 * - Haptic feedback for user interactions
 * - Smooth animations for button state transitions
 * - Profile switching and session tracking
 * 
 * @module TimerScreen
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { LiquidTank } from '../../components/LiquidTank';
import { TimerRing } from '../../components/TimerRing';
import { SessionRepository } from '../../repositories/SessionRepository';
import { useSoundStore } from '../../store/soundStore';
import { useThemeStore } from '../../store/themeStore';
import { useTimerStore } from '../../store/timerStore';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const timerState = useTimerStore();
  const { isRunning, startTime, duration, startTimer, stopTimer, resetTimer, timerMode, setTimerMode, activeProfileId, profiles, setActiveProfile } = timerState;
  const pausedTimeLeft = timerState.pausedTimeLeft ?? null; // Handle missing state from old cache
  const [timeLeft, setTimeLeft] = useState(duration);
  const { theme, timerStyle, ambientSound, focusSound } = useThemeStore(); // Get preferences
  const { customSounds, selectedSoundId } = useSoundStore(); // Get custom sounds
  const systemColorScheme = useColorScheme();
  
  // State to track if alarm is currently ringing
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  /**
   * Button Layout Animation Logic
   * 
   * The control buttons transition between two states:
   * 1. Single "Start" button (timer not started)
   * 2. Three buttons: Pause/Resume, Stop, Skip (timer running or paused)
   * 
   * This effect triggers a smooth LayoutAnimation when transitioning between states,
   * providing visual feedback as buttons appear/disappear with easing.
   */
  const showThreeButtons = isRunning || pausedTimeLeft !== null;
  const prevShowThreeButtons = useRef(showThreeButtons);
  
  useEffect(() => {
    if (prevShowThreeButtons.current !== showThreeButtons) {
      LayoutAnimation.configureNext({
        duration: 400,
        create: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
      });
      prevShowThreeButtons.current = showThreeButtons;
    }
  }, [showThreeButtons]);

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  /**
   * Audio Source Resolution
   * 
   * Determines the audio source for ambient sound playback.
   * Only returns a source if:
   * - User has selected 'custom' as the ambient sound type
   * - A specific sound has been selected from uploaded sounds
   * 
   * @returns AudioSource object with URI or null if no custom sound selected
   */
  /*
   * Audio Source Resolution
   */
  const audioSource = React.useMemo(() => {
    // Priority 1: Alarm Sound (when timer ends)
    if (isAlarmPlaying) {
        if (ambientSound === 'custom' && selectedSoundId) {
            const selectedSound = customSounds.find(s => s.id === selectedSoundId);
            return selectedSound ? { uri: selectedSound.uri } : null;
        }
        if (ambientSound === 'slot_machine') return require('../../assets/sounds/slot_machine.wav');
        if (ambientSound === 'rain') return require('../../assets/sounds/rain.mp3');
        if (ambientSound === 'forest') return require('../../assets/sounds/forest.mp3');
        if (ambientSound === 'white_noise') return require('../../assets/sounds/white_noise.mp3');
    }
    
    // Priority 2: Background Sound (while timer is running)
    if (isRunning) {
        if (focusSound === 'rain') return require('../../assets/sounds/rain.mp3');
        if (focusSound === 'forest') return require('../../assets/sounds/forest.mp3');
        if (focusSound === 'white_noise') return require('../../assets/sounds/white_noise.mp3');
        
        // Default to silence if 'none' or unknown to keep app alive for alarm
        return require('../../assets/sounds/silence.wav');
    }

    return null;
  }, [ambientSound, selectedSoundId, customSounds, isAlarmPlaying, isRunning, focusSound]);
  
  // Use ref to hold the audio player instance
  const playerRef = useRef<any>(null);
  
  /**
   * Audio Player Lifecycle Effect
   */
  useEffect(() => {
    // Clean up previous player
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {
        // Ignore cleanup errors
      }
      playerRef.current = null;
    }
    
    // Create new player if we have a source
    if (audioSource) {
      // Configure audio mode for background playback
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      }).catch((e: Error) => console.warn('Failed to set audio mode:', e));
      
      // createAudioPlayer accepts AudioSource (which includes number for require)
      playerRef.current = createAudioPlayer(audioSource);
    }
    
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [audioSource]);
  


  /**
   * Audio Playback Control Effect
   * 
   * Unified logic:
   * - If we have an audioSource (Silence OR Alarm), play it.
   * - If no source, stop/cleanup handled by previous effect.
   */
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    
    try {
      // Always loop (Silence loops effectively doing nothing, Alarm loops)
      player.loop = true;
      
      if (!player.playing) {
          player.play();
      }
    } catch (error) {
      console.warn('Audio playback error:', error);
    }
  }, [audioSource, isAlarmPlaying, isRunning]);
  
  // Stop alarm when audio source changes (e.g. user changes setting)
  useEffect(() => {
      setIsAlarmPlaying(false);
  }, [ambientSound, selectedSoundId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  /**
   * CORE TIMER LOOP
   * 
   * This is the heart of the Pomodoro timer functionality.
   * 
   * Key Design Decisions:
   * 1. Uses `Date.now()` for accurate elapsed time calculation
   *    (prevents drift from setInterval timing inaccuracies)
   * 2. Updates every 100ms for smooth visual countdown
   * 3. Uses a ref-based guard (`isCompletingRef`) to prevent
   *    double-completion when timer hits zero
   * 
   * Timer Completion Flow:
   * 1. Stop the timer
   * 2. Trigger success haptic feedback
   * 3. Save completed focus sessions to repository
   * 4. Auto-switch to next mode (focus ↔ break)
   */
  const isCompletingRef = React.useRef(false);

  // Reset the completion guard whenever timer restarts
  // This ensures the guard doesn't block legitimate completions after restart
  useEffect(() => {
    if (isRunning) {
        isCompletingRef.current = false;
    }
  }, [isRunning, startTime]);

  // Main countdown interval effect
  useEffect(() => {
    let interval: any;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        // Calculate elapsed time from absolute timestamps (not relative)
        // This prevents timing drift from setInterval delays
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        // Timer completion logic with guard to prevent race conditions
        if (remaining <= 0 && !isCompletingRef.current) {
          isCompletingRef.current = true; // Lock to prevent double execution
          stopTimer();
          setIsAlarmPlaying(true); // Trigger alarm sound
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Persist completed focus sessions for analytics
          // Break sessions are not saved as they don't count as "work"
          if (startTime && timerMode === 'focus') {
              SessionRepository.saveSession({
                id: Math.random().toString(36).substr(2, 9),
                startTime: startTime,
                duration: duration,
                completedAt: Date.now(),
                type: 'focus',
              });
          }

          // Auto-transition to the next timer mode
          if (timerMode === 'focus') {
              setTimerMode('break');
          } else {
              setTimerMode('focus');
          }
        }
      }, 100); // 100ms update interval for smooth countdown display
    } else {
      // When not running, show remaining time if paused, or full duration
      setTimeLeft(pausedTimeLeft ?? duration);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, duration, stopTimer, timerMode, setTimerMode, pausedTimeLeft]);

  const toggleTimer = () => {
    setIsAlarmPlaying(false);
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
      setIsAlarmPlaying(false);
      setActiveProfile(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Skip to Next Phase
   * 
   * Allows users to manually skip the current timer phase without completing it.
   * Useful when user wants to:
   * - End a focus session early and start break
   * - Skip break and return to focus
   * 
   * Does NOT save the session when skipping (only completed sessions are tracked)
   */
  const skipPhase = () => {
    setIsAlarmPlaying(false);
    const nextMode = timerMode === 'focus' ? 'break' : 'focus';
    setTimerMode(nextMode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Calculate total duration based on profile settings for consistent progress bar
  const totalDuration = timerMode === 'focus' 
    ? (activeProfile.workDuration * 60) 
    : (activeProfile.breakDuration * 60);

  const progress = 1 - (timeLeft / totalDuration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;



  return (
    <ScrollView 
      style={[styles.scrollContainer, { backgroundColor }]}
      contentContainerStyle={[styles.container, { /* paddingTop: insets.top, */ paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      
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
        style={[styles.timerCard, timerStyle === 'sand' && styles.timerCardSand]} 
        intensity={80}
        glassEffectStyle="regular"
      >
        <View style={styles.contentContainer}>
          {timerStyle === 'sand' ? (
              <View style={styles.sandContainer}>
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      <Text style={[styles.modeText, { color: secondaryTextColor }]}>{activeProfile.name}</Text>
                      {timerMode === 'focus' && (
                          <Text style={[styles.durationText, { color: secondaryTextColor }]}>
                              {activeProfile.workDuration}/{activeProfile.breakDuration}
                          </Text>
                      )}
                      <Text style={[
                          styles.timeText, 
                          { color: textColor, fontSize: 64, lineHeight: 70 },
                          Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }
                      ]}>
                          {formattedTime}
                      </Text>
                  </View>
                  <LiquidTank progress={progress} size={240} />
              </View>
          ) : (
              <>
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
              </>
          )}
        </View>
      </GlassView>

      <View style={styles.controls}>
        {/* Before timer starts - single Start button */}
        {!isRunning && pausedTimeLeft === null ? (
          <Pressable onPress={() => {
            setIsAlarmPlaying(false);
            startTimer();
          }}>
            <GlassView 
              style={styles.controlPill} 
              intensity={isDark ? 60 : 80} 
              isInteractive
            >
              <Text style={[styles.controlText, { color: textColor }]}>
                {timerMode === 'focus' ? 'Start Focus' : 'Start Break'}
              </Text>
            </GlassView>
          </Pressable>
        ) : (
          /* Timer is running or paused - show 3 buttons */
          <View style={styles.controlButtonRow}>
            {/* Pause/Resume Button */}
            <Pressable onPress={toggleTimer}>
              <GlassView 
                style={styles.controlPillSmall} 
                intensity={isDark ? 60 : 80} 
                isInteractive
              >
                <Text style={[styles.controlText, { color: textColor }]}>
                  {isRunning ? 'Pause' : 'Resume'}
                </Text>
              </GlassView>
            </Pressable>

            {/* Stop Button */}
            <Pressable onPress={() => {
              setIsAlarmPlaying(false);
              resetTimer();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }}>
              <GlassView 
                style={styles.controlPillSmall} 
                intensity={isDark ? 40 : 60} 
                isInteractive
              >
                <Text style={[styles.controlText, { color: textColor }]}>
                  Stop
                </Text>
              </GlassView>
            </Pressable>

            {/* Skip Phase Button */}
            <Pressable onPress={skipPhase}>
              <GlassView 
                style={styles.controlPillSmall} 
                intensity={isDark ? 40 : 60} 
                isInteractive
              >
                <Text style={[styles.controlText, { color: textColor }]}>
                  {timerMode === 'focus' ? 'Skip' : 'Skip'}
                </Text>
              </GlassView>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
  },
  profileSelectorContainer: {
      height: 60,
      width: '100%',
      marginTop: 8,
      marginBottom: 16,
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
  timerCardSand: {
    height: 440,
  },
  sandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
    marginTop: 16,
  },
  controlButtonRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  controlPill: {
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlPillSmall: {
    width: 160,
    alignItems: 'center',
    paddingVertical: 14,
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
