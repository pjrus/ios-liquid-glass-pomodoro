import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CustomSound {
  id: string;
  name: string;
  uri: string;
  addedAt: number;
}

interface SoundState {
  customSounds: CustomSound[];
  selectedSoundId: string | null; // ID of selected custom sound, null means using preset from themeStore
  hasLoaded: boolean;
  addCustomSound: (name: string, sourceUri: string) => Promise<void>;
  deleteCustomSound: (id: string) => Promise<void>;
  setSelectedSound: (id: string | null) => void;
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
      selectedSoundId: null,
      hasLoaded: false,

      addCustomSound: async (name: string, sourceUri: string) => {
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
          addedAt: Date.now(),
        };
        
        set((state) => ({
          customSounds: [...state.customSounds, newSound],
          selectedSoundId: id, // Auto-select the newly added sound
        }));
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
            // If deleted sound was selected, reset to null
            selectedSoundId: state.selectedSoundId === id ? null : state.selectedSoundId,
          }));
        }
      },

      setSelectedSound: (id: string | null) => {
        set({ selectedSoundId: id });
      },

      setHasLoaded: (state: boolean) => {
        set({ hasLoaded: state });
      },
    }),
    {
      name: 'sound-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasLoaded(true);
      },
    }
  )
);
