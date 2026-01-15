/**
 * Timer Store - Pomodoro Timer State Management
 * 
 * This Zustand store manages all timer-related state including:
 * - Timer state (running, paused, duration)
 * - Timer profiles (presets like "Standard", "Short Focus")
 * - Persistence via AsyncStorage
 * 
 * KEY CONCEPTS:
 * - `startTime`: Absolute timestamp when timer started (for drift-free timing)
 * - `pausedTimeLeft`: Remaining time when paused (enables resume)
 * - Timer modes: 'focus' (work) and 'break' (rest)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Timer profile configuration */
export interface TimerProfile {
  id: string;
  name: string;
  workDuration: number;  // Focus period in minutes
  breakDuration: number; // Break period in minutes
}

/** Built-in default profiles */
export const DEFAULT_PROFILES: TimerProfile[] = [
  { id: 'standard', name: 'Standard', workDuration: 25, breakDuration: 5 },
  { id: 'short', name: 'Short Focus', workDuration: 10, breakDuration: 5 },
];

interface TimerState {
  // Timer State
  duration: number; // in seconds
  startTime: number | null; // Timestamp
  isRunning: boolean;
  timerMode: 'focus' | 'break';
  pausedTimeLeft: number | null; // Time remaining when paused

  // Profile State
  profiles: TimerProfile[];
  activeProfileId: string;

  // Actions
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  setTimerMode: (mode: 'focus' | 'break') => void;
  
  // Profile Actions
  addProfile: (name: string, workDuration: number, breakDuration: number) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial Timer State
      duration: 25 * 60,
      startTime: null,
      isRunning: false,
      timerMode: 'focus',
      pausedTimeLeft: null,

      // Initial Profile State
      profiles: DEFAULT_PROFILES,
      activeProfileId: 'standard',

      /**
       * Start Timer
       * 
       * Begins countdown from current duration (or paused time if resuming).
       * Schedules a local notification for timer completion.
       */
      startTimer: async () => {
        const { duration, pausedTimeLeft } = get();
        
        // Resume from paused time or start fresh
        const effectiveDuration = pausedTimeLeft !== null ? pausedTimeLeft : duration;
        const startTime = Date.now();
        
        // Schedule completion notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Timer Complete",
            body: "Your focus session has ended.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.round(effectiveDuration)),
            repeats: false,
          },
        });

        set({ 
          isRunning: true, 
          startTime,
          duration: effectiveDuration,
          pausedTimeLeft: null 
        });
      },

      /**
       * Stop Timer (Pause)
       * 
       * Pauses the timer and saves remaining time for resume.
       * Cancels any scheduled notifications.
       */
      stopTimer: async () => {
        const { startTime, duration } = get();
        await Notifications.cancelAllScheduledNotificationsAsync();
        
        // Calculate and save remaining time for resume
        let timeLeft = duration;
        if (startTime) {
          const elapsed = (Date.now() - startTime) / 1000;
          timeLeft = Math.max(0, duration - elapsed);
        }
        
        set({ 
          isRunning: false, 
          startTime: null,
          pausedTimeLeft: timeLeft > 0 ? timeLeft : null
        });
      },

      /**
       * Reset Timer
       * 
       * Completely stops timer and resets to initial focus duration.
       * Returns to focus mode regardless of current mode.
       */
      resetTimer: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        const { profiles, activeProfileId } = get();
        const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
        const originalDuration = activeProfile.workDuration * 60;
        
        set({ 
          isRunning: false, 
          startTime: null,
          duration: originalDuration,
          pausedTimeLeft: null,
          timerMode: 'focus'
        });
      },

      setTimerMode: (mode) => {
        const { profiles, activeProfileId } = get();
        const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
        const newDuration = mode === 'focus' 
          ? activeProfile.workDuration * 60 
          : activeProfile.breakDuration * 60;

        set({ 
          timerMode: mode,
          duration: newDuration,
          isRunning: false,
          startTime: null,
          pausedTimeLeft: null
        });
      },

      addProfile: (name, workDuration, breakDuration) => {
        set((state) => ({
          profiles: [
            ...state.profiles,
            {
              id: Math.random().toString(36).substr(2, 9),
              name,
              workDuration,
              breakDuration,
            },
          ],
        }));
      },

      deleteProfile: (id) => {
        set((state) => {
          const newProfiles = state.profiles.filter((p) => p.id !== id);
          // If active profile is deleted, switch to first available
          let newActiveId = state.activeProfileId;
          if (state.activeProfileId === id) {
            newActiveId = newProfiles[0]?.id || '';
          }
          
          // Also update duration if we switched profiles
          const activeProfile = newProfiles.find(p => p.id === newActiveId) || newProfiles[0];
          const newDuration = state.timerMode === 'focus' 
            ? activeProfile.workDuration * 60 
            : activeProfile.breakDuration * 60;

          return {
            profiles: newProfiles,
            activeProfileId: newActiveId,
            duration: newDuration,
            isRunning: false,
            startTime: null
          };
        });
      },

      setActiveProfile: (id) => {
        const { profiles, timerMode } = get();
        const profile = profiles.find((p) => p.id === id);
        if (profile) {
          set({
            activeProfileId: id,
            duration: timerMode === 'focus' ? profile.workDuration * 60 : profile.breakDuration * 60,
            isRunning: false,
            startTime: null,
          });
        }
      },
    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
