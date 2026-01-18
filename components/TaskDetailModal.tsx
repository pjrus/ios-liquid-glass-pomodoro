import React from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    useColorScheme
} from 'react-native';
import { Task } from '../store/taskStore';
import { useThemeStore } from '../store/themeStore';
import { TaskDetailContent } from './TaskDetailContent';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onUpdate,
}) => {
  const systemColorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';
  
  if (!task) return null;

  // For PageSheet, we don't want transparent background, we want the sheet to have a solid color
  // contrasting with the app in the background.
  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor }]}
      >
        <TaskDetailContent 
            task={task} 
            onClose={onClose} 
            onUpdate={onUpdate} 
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
