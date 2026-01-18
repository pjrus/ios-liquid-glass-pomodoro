import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { Task, useTaskStore } from '../../store/taskStore';
import { useThemeStore } from '../../store/themeStore';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const { tasks, addTask, toggleTask, deleteTask, activeTaskId, setActiveTask } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim());
      setNewTaskTitle('');
      Keyboard.dismiss();
    }
  };

  const handleFocus = (taskId: string) => {
    setActiveTask(taskId);
    // Switch to the first tab (timer)
    router.push('/');
  };
  
  const handleToggle = (taskId: string) => {
      toggleTask(taskId);
  };
  
  const handleDelete = (taskId: string) => {
      deleteTask(taskId);
  };

  const renderItem = ({ item }: { item: Task }) => {
    const isActive = activeTaskId === item.id;
    
    return (
      <View style={styles.taskContainer}>
          {/* 
            Using Expo Router Link with Context Menu.
            This provides native iOS context menu (long press) with partial preview.
          */}
          <Link href={`/task/${item.id}`} style={{ flex: 1, width: '100%' }}>
            <Link.Trigger style={{ width: '100%' }}>
              {/* @ts-ignore: glassview props */}
                <GlassView
                  intensity={isDark ? 40 : 60}
                  style={[
                    styles.taskItem, 
                    item.completed && styles.taskItemCompleted,
                    isActive && styles.taskItemActive
                  ]}
                  isInteractive={false} 
                >
                  {/* Main Content */}
                  <View style={styles.mainContent}>
                    
                    {/* Checkbox (Toggle Completion) */}
                    <Pressable 
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleTask(item.id);
                        }}
                        hitSlop={10}
                    >
                        <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                            {item.completed && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                    </Pressable>

                    {/* Content */}
                    <View style={styles.taskContent}>
                      <View style={styles.textContainer}>
                        <Text
                          style={[
                            styles.taskText,
                            { color: isDark ? '#FFF' : '#000' },
                            item.completed && { textDecorationLine: 'line-through', opacity: 0.5 },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.pomodorosCompleted > 0 && (
                           <Text style={[styles.statsText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
                             {item.pomodorosCompleted} focus session{item.pomodorosCompleted !== 1 ? 's' : ''}
                           </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.actions}>
                       {!item.completed && (
                          <Pressable 
                            onPress={(e) => {
                                e.stopPropagation();
                                handleFocus(item.id);
                            }} 
                            style={[
                                styles.focusButton,
                                isActive && { backgroundColor: isDark ? '#0A84FF' : '#007AFF' }
                            ]}
                          >
                            <Ionicons 
                                name={isActive ? "radio-button-on" : "play"} 
                                size={16} 
                                color={isActive ? "#FFF" : (isDark ? "#0A84FF" : "#007AFF")} 
                            />
                            <Text style={[
                                styles.focusText,
                                { color: isActive ? "#FFF" : (isDark ? "#0A84FF" : "#007AFF") }
                            ]}>
                                {isActive ? 'Active' : 'Focus'}
                            </Text>
                          </Pressable>
                       )}
                      <Pressable 
                        onPress={(e) => {
                            e.stopPropagation();
                            deleteTask(item.id);
                        }} 
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={isDark ? '#ff6b6b' : '#ff3b30'} />
                      </Pressable>
                    </View>
                  </View>
                </GlassView>
            </Link.Trigger>
            <Link.Menu>
                <Link.MenuAction 
                    title="Focus" 
                    icon="play" 
                    onPress={() => handleFocus(item.id)} 
                />
                <Link.MenuAction 
                    title={item.completed ? "Mark as Undone" : "Mark as Done"} 
                    icon={item.completed ? "circle" : "checkmark.circle"} 
                    onPress={() => handleToggle(item.id)} 
                />
                <Link.MenuAction 
                    title="Delete" 
                    icon="trash" 
                    destructive 
                    onPress={() => handleDelete(item.id)} 
                />
            </Link.Menu>
          </Link>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.innerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Tasks</Text>

          <View style={styles.inputContainer}>
            <GlassView intensity={isDark ? 30 : 50} style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
                placeholder="Add a new task..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
              />
              <Pressable onPress={handleAddTask} style={styles.addButton}>
                <Ionicons name="add-circle" size={32} color={isDark ? '#0A84FF' : '#007AFF'} />
              </Pressable>
            </GlassView>
          </View>

          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  No tasks yet. Add one to start tracking!
                </Text>
              </View>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 0,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskContainer: {
    marginBottom: 12,
    width: '100%',
  },
  taskItem: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  taskItemActive: {
    borderColor: '#0A84FF',
    borderWidth: 1,
  },
  taskItemCompleted: {
    opacity: 0.8,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  textContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 17,
    fontWeight: '500',
  },
  statsText: {
      fontSize: 12,
      marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: 'rgba(10, 132, 255, 0.15)',
      gap: 4,
  },
  focusText: {
      fontSize: 13,
      fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 4,
  },
});
