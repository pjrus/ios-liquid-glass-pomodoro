import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, useColorScheme } from 'react-native';
import { TaskDetailContent } from '../../components/TaskDetailContent';
import { useTaskStore } from '../../store/taskStore';
import { useThemeStore } from '../../store/themeStore';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, updateTask } = useTaskStore();
  const task = tasks.find((t) => t.id === id);

  const systemColorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  // For PageSheet, we want a solid background
  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';

  if (!task) {
    return null; // Or some loading/not found state
  }

  return (
    <>
      <Stack.Screen options={{
        presentation: 'formSheet',
        headerShown: false,
        sheetAllowedDetents: [1.0], // Full height sheet
      }} />
       <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor }]}
      >
        <TaskDetailContent 
            task={task} 
            onClose={() => router.back()} 
            onUpdate={updateTask} 
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
