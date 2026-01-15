/**
 * Theme Store - App Preferences with Zustand Persistence
 * 
 * Manages user preferences for theme, timer style, and audio.
 * Uses persist middleware to save/load from AsyncStorage.
 * 
 * HYDRATION:
 * - `hasLoaded` tracks when AsyncStorage data is loaded
 * - Critical for preventing theme flash on startup
 * - See useAppTheme hook for how this is used
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Theme selection - explicit or follow system */
export type ThemeType = 'light' | 'dark' | 'system';

/** Timer display visualization */
export type TimerStyle = 'ring' | 'sand';

/** Background audio options */
export type AmbientSound = 'none' | 'rain' | 'forest' | 'white_noise' | 'slot_machine' | 'custom';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  timerStyle: TimerStyle;
  setTimerStyle: (style: TimerStyle) => void;
  ambientSound: AmbientSound; // Main Alarm Sound
  setAmbientSound: (sound: AmbientSound) => void;
  focusSound: 'none' | 'rain' | 'forest' | 'white_noise';
  setFocusSound: (sound: 'none' | 'rain' | 'forest' | 'white_noise') => void;
  hasLoaded: boolean;
  setHasLoaded: (state: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      timerStyle: 'ring',
      setTimerStyle: (style) => set({ timerStyle: style }),
      ambientSound: 'slot_machine',
      setAmbientSound: (sound) => set({ ambientSound: sound }),
      focusSound: 'none',
      setFocusSound: (sound) => set({ focusSound: sound }),
      hasLoaded: false,
      setHasLoaded: (state) => set({ hasLoaded: state }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasLoaded(true);
      },
    }
  )
);
