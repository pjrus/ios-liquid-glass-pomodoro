import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useTimerStore } from './timerStore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  pomodorosCompleted: number;
  history?: number[]; // Array of timestamps
}

interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setActiveTask: (id: string | null) => void;
  incrementTaskPomodoros: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,
      addTask: (title) => {
        set((state) => ({
          tasks: [
            {
              id: Math.random().toString(36).substr(2, 9),
              title,
              description: '',
              completed: false,
              createdAt: Date.now(),
              pomodorosCompleted: 0,
              history: [],
            },
            ...state.tasks,
          ],
        }));
      },
      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }));
      },
      deleteTask: (id) => {
        const { activeTaskId } = get();
        
        if (activeTaskId === id) {
          useTimerStore.getState().resetTimer();
          Alert.alert(
            "Focused Task Deleted",
            "The timer has been reset because the focused task was deleted."
          );
        }

        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
        }));
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      setActiveTask: (id) => set({ activeTaskId: id }),
      incrementTaskPomodoros: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id 
            ? { 
                ...task, 
                pomodorosCompleted: (task.pomodorosCompleted || 0) + 1,
                history: [...(task.history || []), Date.now()]
              } 
            : task
          ),
        }));
      },
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
