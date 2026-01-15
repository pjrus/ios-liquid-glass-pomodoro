import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeType = 'light' | 'dark' | 'system';

export type TimerStyle = 'ring' | 'sand';
export type AmbientSound = 'none' | 'rain' | 'forest' | 'white_noise' | 'custom';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  timerStyle: TimerStyle;
  setTimerStyle: (style: TimerStyle) => void;
  ambientSound: AmbientSound;
  setAmbientSound: (sound: AmbientSound) => void;
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
      ambientSound: 'none',
      setAmbientSound: (sound) => set({ ambientSound: sound }),
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
