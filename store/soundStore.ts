import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SoundCategory = 'alarm' | 'background';

export interface CustomSound {
  id: string;
  name: string;
  uri: string;
  category: SoundCategory; // 'alarm' or 'background'
  addedAt: number;
}

interface SoundState {
  customSounds: CustomSound[];
  selectedAlarmSoundId: string | null;      // ID for custom alarm sound
  selectedBackgroundSoundId: string | null; // ID for custom background sound
  hasLoaded: boolean;
  addCustomSound: (name: string, sourceUri: string, category: SoundCategory) => Promise<void>;
  deleteCustomSound: (id: string) => Promise<void>;
  setSelectedAlarmSound: (id: string | null) => void;
  setSelectedBackgroundSound: (id: string | null) => void;
  setHasLoaded: (state: boolean) => void;
}

// Max file size: 10MB
export const MAX_SOUND_FILE_SIZE = 10 * 1024 * 1024;

// Get the sounds directory
function getSoundsDirectory(): Directory {
  return new Directory(Paths.document, 'custom_sounds');
}

// Ensure sounds directory exists
async function ensureSoundsDirectory(): Promise<Directory> {
  const soundsDir = getSoundsDirectory();
  if (!soundsDir.exists) {
    soundsDir.create();
  }
  return soundsDir;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      customSounds: [],
      selectedAlarmSoundId: null,
      selectedBackgroundSoundId: null,
      hasLoaded: false,

      addCustomSound: async (name: string, sourceUri: string, category: SoundCategory) => {
        const soundsDir = await ensureSoundsDirectory();
        
        const id = Math.random().toString(36).substr(2, 9);
        const extension = sourceUri.split('.').pop() || 'mp3';
        const destFile = new File(soundsDir, `${id}.${extension}`);
        
        // Copy file from source to app's document directory
        const sourceFile = new File(sourceUri);
        sourceFile.copy(destFile);
        
        const newSound: CustomSound = {
          id,
          name,
          uri: destFile.uri,
          category,
          addedAt: Date.now(),
        };
        
        set((state) => {
          const newState: Partial<SoundState> = {
            customSounds: [...state.customSounds, newSound],
          };
          
          if (category === 'alarm') {
            newState.selectedAlarmSoundId = id;
          } else {
            newState.selectedBackgroundSoundId = id;
          }
          
          return newState as SoundState;
        });
      },

      deleteCustomSound: async (id: string) => {
        const sound = get().customSounds.find((s) => s.id === id);
        if (sound) {
          // Delete the file
          try {
            const file = new File(sound.uri);
            if (file.exists) {
              file.delete();
            }
          } catch (error) {
            console.error('Failed to delete sound file:', error);
          }
          
          set((state) => ({
            customSounds: state.customSounds.filter((s) => s.id !== id),
            // Reset selection if deleted
            selectedAlarmSoundId: state.selectedAlarmSoundId === id ? null : state.selectedAlarmSoundId,
            selectedBackgroundSoundId: state.selectedBackgroundSoundId === id ? null : state.selectedBackgroundSoundId,
          }));
        }
      },

      setSelectedAlarmSound: (id: string | null) => {
        set({ selectedAlarmSoundId: id });
      },

      setSelectedBackgroundSound: (id: string | null) => {
        set({ selectedBackgroundSoundId: id });
      },

      setHasLoaded: (state: boolean) => {
        set({ hasLoaded: state });
      },
    }),
    {
      name: 'sound-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.setHasLoaded(true);
            // Migration for existing sounds (default to alarm if category missing)
            // Note: This runs after rehydration. Zustand persist handles merging.
            // However, we need to ensure old data structure fits. 
            // Since we changed interface, we might need a migration strategy or just accept they might be undefined initially.
            // Let's assume a simple fix:
            const sounds = state.customSounds as any[]; 
            const fixedSounds = sounds.map(s => ({
                ...s,
                category: s.category || 'alarm'
            }));
            
            // Fix selectedSoundId -> selectedAlarmSoundId if needed (manual check not easily done here without accessing raw storage, 
            // but Zustand usually maps exact keys. Old key 'selectedSoundId' will be lost, so user selects again. That's fine.)
            state.customSounds = fixedSounds;
        }
      },
    }
  )
);
