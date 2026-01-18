import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    useColorScheme
} from 'react-native';
import { Task } from '../store/taskStore';
import { useThemeStore } from '../store/themeStore';
import { FocusHistoryGraph } from './FocusHistoryGraph';

interface TaskDetailContentProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  isPreview?: boolean;
}

export const TaskDetailContent: React.FC<TaskDetailContentProps> = ({
  task,
  onClose,
  onUpdate,
  isPreview = false,
}) => {
  const systemColorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';
  
  const [description, setDescription] = useState(task.description || '');

  useEffect(() => {
    setDescription(task.description || '');
  }, [task]);

  const totalFocusMinutes = task.pomodorosCompleted * 25;

  return (
    <View style={styles.content}>
        {!isPreview && (
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={2}>
                    {task.title}
                </Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.doneText}>Done</Text>
                </Pressable>
            </View>
        )}

        {/* In preview, show title if not showing full header */}
        {isPreview && (
             <Text style={[styles.title, { color: isDark ? '#FFF' : '#000', marginBottom: 20 }]} numberOfLines={2}>
                {task.title}
            </Text>
        )}

        <View style={[styles.statRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="time" size={20} color="#0A84FF" />
            <Text style={[styles.statText, { color: isDark ? '#FFF' : '#000' }]}>
                Total Focus Time: <Text style={{ fontWeight: 'bold' }}>{totalFocusMinutes} mins</Text>
            </Text>
        </View>

        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
                Description
            </Text>
            {isPreview ? (
                <Text 
                    style={[
                        styles.descriptionText, 
                        { color: isDark ? '#FFF' : '#000', marginBottom: 20 }
                    ]}
                    numberOfLines={3}
                >
                    {description || "No description provided."}
                </Text>
            ) : (
                <TextInput
                    style={[
                        styles.input, 
                        { 
                            color: isDark ? '#FFF' : '#000',
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' 
                        }
                    ]}
                    multiline
                    placeholder="Add a description..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    value={description}
                    onChangeText={setDescription}
                    onBlur={() => onUpdate(task.id, { description })}
                />
            )}
        </View>

        <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
            Focus History
        </Text>
        <FocusHistoryGraph history={task.history} />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  doneText: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
  },
  statText: {
    fontSize: 17,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 17,
    textAlignVertical: 'top',
    flex: 1,
    marginBottom: 20,
  },
  descriptionText: {
      fontSize: 17,
      lineHeight: 24,
  }
});
