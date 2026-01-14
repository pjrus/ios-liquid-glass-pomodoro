import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface TimerState {
  duration: number; // in seconds
  startTime: number | null; // Timestamp
  isRunning: boolean;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  setDuration: (duration: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      duration: 25 * 60,
      startTime: null,
      isRunning: false,

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

      setDuration: (duration) => {
        set({ duration });
      },
    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
