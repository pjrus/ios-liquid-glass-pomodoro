import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface TimerProfile {
  id: string;
  name: string;
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
}

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

  // Profile State
  profiles: TimerProfile[];
  activeProfileId: string;

  // Actions
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
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

      // Initial Profile State
      profiles: DEFAULT_PROFILES,
      activeProfileId: 'standard',

      startTimer: async () => {
        const { duration } = get();
        const startTime = Date.now();
        
        // Schedule notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Timer Complete",
            body: "Your focus session has ended.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: duration,
            repeats: false,
          },
        });

        set({ isRunning: true, startTime });
      },

      stopTimer: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        set({ isRunning: false, startTime: null });
      },

      resetTimer: () => {
        get().stopTimer(); // Cancel notifs
        set({ isRunning: false, startTime: null });
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
          startTime: null
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
