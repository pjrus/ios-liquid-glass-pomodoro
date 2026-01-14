import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Session {
  id: string;
  startTime: number;
  duration: number; // in seconds
  completedAt: number;
  type: 'focus' | 'break';
}

const STORAGE_KEY = 'pomodoro_sessions';

export const SessionRepository = {
  async saveSession(session: Session): Promise<void> {
    try {
      const existing = await this.getAllSessions();
      const updated = [...existing, session];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save session', error);
    }
  },

  async getAllSessions(): Promise<Session[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Failed to get sessions', error);
      return [];
    }
  },

  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};
