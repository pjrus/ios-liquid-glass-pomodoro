import { createAudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { MAX_SOUND_FILE_SIZE, useSoundStore } from '../../store/soundStore';
import { ThemeType, useThemeStore } from '../../store/themeStore';
import { DEFAULT_PROFILES, useTimerStore } from '../../store/timerStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const { theme, setTheme, timerStyle, setTimerStyle, ambientSound, setAmbientSound, focusSound, setFocusSound } = useThemeStore();
  const { profiles, addProfile, deleteProfile } = useTimerStore();
  const { 
    customSounds, 
    selectedAlarmSoundId, 
    selectedBackgroundSoundId, 
    addCustomSound, 
    deleteCustomSound, 
    setSelectedAlarmSound,
    setSelectedBackgroundSound
  } = useSoundStore();
  
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  const inputBackgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  // New Profile State
  const [modalVisible, setModalVisible] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newWorkDuration, setNewWorkDuration] = useState('');
  const [newBreakDuration, setNewBreakDuration] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewingSoundUri, setPreviewingSoundUri] = useState<string | null>(null);
  
  // Audio player ref for preview (using ref to avoid hook issues)
  const previewPlayerRef = React.useRef<any>(null);

  const handleThemeChange = (newTheme: ThemeType) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
  };

  const handleTimerStyleChange = (style: any) => {
      if (style !== timerStyle) {
          setTimerStyle(style);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      }
  };

  const handleSoundChange = (sound: any) => {
      if (sound !== ambientSound) {
          setAmbientSound(sound);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      }
  };

  const handleFocusSoundChange = (sound: any) => {
      if (sound !== focusSound) {
          setFocusSound(sound);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      }
  };

  // Validate inputs and create a new custom timer profile
  const handleAddProfile = () => {
    if (!newProfileName || !newWorkDuration || !newBreakDuration) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const work = parseInt(newWorkDuration);
    const breakTime = parseInt(newBreakDuration);

    if (isNaN(work) || isNaN(breakTime)) {
      Alert.alert('Error', 'Duration must be a number');
      return;
    }

    addProfile(newProfileName, work, breakTime);
    setNewProfileName('');
    setNewWorkDuration('');
    setNewBreakDuration('');
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Prompt for confirmation before deleting a profile to prevent accidental data loss
  const handleDeleteProfile = (id: string, name: string) => {
      Alert.alert(
          "Delete Profile",
          `Are you sure you want to delete "${name}"?`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => {
                      deleteProfile(id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
              }
          ]
      );
  };

  // Handle uploading a custom sound file
  const handleUploadSound = async (category: 'alarm' | 'background') => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      
      const file = result.assets[0];
      
      // Check file size
      if (file.size && file.size > MAX_SOUND_FILE_SIZE) {
        Alert.alert('File Too Large', 'Please select an audio file under 10MB.');
        return;
      }
      
      // Get file name without extension for display
      const name = file.name?.replace(/\.[^/.]+$/, '') || 'Custom Sound';
      
      await addCustomSound(name, file.uri, category);
      
      if (category === 'alarm') {
          setAmbientSound('custom'); 
      } else {
          setFocusSound('custom');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload sound file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deleting a custom sound
  const handleDeleteSound = (id: string, name: string) => {
    Alert.alert(
      'Delete Sound',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomSound(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  // Handle selecting a custom sound
  const handleSelectCustomSound = (id: string, category: 'alarm' | 'background') => {
    if (category === 'alarm') {
        setSelectedAlarmSound(id);
        setAmbientSound('custom');
    } else {
        setSelectedBackgroundSound(id);
        setFocusSound('custom');
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  };

  // Map of preset sound IDs to their assets
  const PRESET_SOUNDS: Record<string, any> = {
      'slot_machine': require('../../assets/sounds/slot_machine.wav'),
      'rain': require('../../assets/sounds/rain.mp3'),
      'forest': require('../../assets/sounds/forest.mp3'),
      'white_noise': require('../../assets/sounds/white_noise.mp3'),
  };

  // Handle previewing a sound (works for both custom URIs and preset assets)
  const handlePreviewSound = (source: string | number) => {
    try {
      // Logic to determine unique identifier for the sound being previewed
      // For custom sounds, it's the URI string
      // For presets, it's the asset ID (number)
      
      const soundId = source; 

      // Stop current preview if exists
      if (previewPlayerRef.current) {
        try {
            previewPlayerRef.current.pause();
            previewPlayerRef.current.remove();
        } catch {
            // Ignore cleanup errors
        }
        previewPlayerRef.current = null;
      }

      // If clicking same sound that was playing, just stop
      if (previewingSoundUri === soundId) {
        setPreviewingSoundUri(null);
        return;
      }

      // Create new player and start preview
      // Note: createAudioPlayer accepts { uri: string } OR number (Asset ID) directly or via source object?
      // Looking at index.tsx usage: createAudioPlayer(audioSource) where audioSource is { uri } OR require(...)
      // So we can pass 'source' directly if it matches that shape.
      // If source is a number (require result), pass it directly? 
      // expo-audio types suggest: AudioSource can be number | { uri: string }
      
      setPreviewingSoundUri(soundId as any);
      
      const playerSource = typeof source === 'string' ? { uri: source } : source;
      const player = createAudioPlayer(playerSource);
      previewPlayerRef.current = player;
      player.play();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Preview error:', error);
      setPreviewingSoundUri(null);
    }
  };

  const SettingRow = ({ label, isSelected, onPress, icon }: { label: string, isSelected: boolean, onPress: () => void, icon?: string }) => (
    <Pressable onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          {icon && <SymbolView name={icon as any} tintColor={textColor} size={20} />}
          <Text style={[styles.rowText, { color: textColor }]}>{label}</Text>
        </View>
        {isSelected && (
          <SymbolView name={"checkmark" as any} tintColor="#007AFF" size={18} />
        )}
      </View>
    </Pressable>
  );

  const SoundRow = ({ 
      label, 
      soundId,
      isSelected, 
      onSelect, 
      icon,
      isCustom = false,
      customSoundId
  }: { 
      label: string, 
      soundId: string, // 'rain', 'forest' or custom uri/id
      isSelected: boolean, 
      onSelect: () => void, 
      icon?: string,
      isCustom?: boolean,
      customSoundId?: string
  }) => {
      // Determine what to pass to preview
      // If custom, we need the URI. If preset, we need the asset from map.
      let previewSource: any = null;
      let uniquePreviewId: any = null;

      if (isCustom && customSoundId) {
          // Find custom sound to get URI
          const sound = customSounds.find(s => s.id === customSoundId);
          if (sound) {
              previewSource = sound.uri;
              uniquePreviewId = sound.uri;
          }
      } else {
          previewSource = PRESET_SOUNDS[soundId];
          uniquePreviewId = PRESET_SOUNDS[soundId];
      }

      const isPreviewing = uniquePreviewId && previewingSoundUri === uniquePreviewId;
      const canPreview = !!previewSource;

      return (
        <Pressable onPress={onSelect}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              {icon && <SymbolView name={icon as any} tintColor={textColor} size={20} />}
              <Text style={[styles.rowText, { color: textColor }]}>{label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {isSelected && (
                  <SymbolView name={"checkmark" as any} tintColor="#007AFF" size={18} />
                )}
                
                {canPreview && (
                    <TouchableOpacity onPress={(e) => { 
                        e.stopPropagation(); 
                        handlePreviewSound(previewSource); 
                    }}>
                        <SymbolView 
                            name={isPreviewing ? "stop.fill" : "play.fill"} 
                            tintColor="#007AFF" 
                            size={16} 
                        />
                    </TouchableOpacity>
                )}

                {isCustom && customSoundId && (
                    <TouchableOpacity onPress={() => {
                        const sound = customSounds.find(s => s.id === customSoundId);
                        if (sound) handleDeleteSound(sound.id, sound.name);
                    }}>
                        <SymbolView name="trash" tintColor="#FF3B30" size={16} />
                    </TouchableOpacity>
                )}
            </View>
          </View>
        </Pressable>
      );
  };

  const ThemeRow = ({ label, value, icon }: { label: string, value: ThemeType, icon: string }) => (
    <SettingRow label={label} isSelected={theme === value} onPress={() => handleThemeChange(value)} icon={icon} />
  );

  const backgroundColor = isDark ? '#000000' : '#F2F2F7';

  // Filter custom sounds
  const alarmCustomSounds = customSounds.filter(s => s.category === 'alarm' || !s.category); // Include legacy (no category) as alarm
  const backgroundCustomSounds = customSounds.filter(s => s.category === 'background');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Settings</Text>
        
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>APPEARANCE</Text>
        <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
          <ThemeRow label="Light" value="light" icon="sun.max.fill" />
          <View style={styles.separator} />
          <ThemeRow label="Dark" value="dark" icon="moon.fill" />
          <View style={styles.separator} />
          <ThemeRow label="System" value="system" icon="iphone" />
        </GlassView>

        <View style={{ marginTop: 30 }}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>TIMER VISUALS</Text>
            <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
                <SettingRow label="Ring" isSelected={timerStyle === 'ring'} onPress={() => handleTimerStyleChange('ring')} icon="circle" />
                <View style={styles.separator} />
                <SettingRow label="Liquid Tank" isSelected={timerStyle === 'sand'} onPress={() => handleTimerStyleChange('sand')} icon="drop.fill" />
            </GlassView>
        </View>

        <View style={{ marginTop: 30 }}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>BACKGROUND SOUND (DURING TIMER)</Text>
            <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
                <SoundRow 
                    label="Off" 
                    soundId="none" 
                    isSelected={focusSound === 'none'} 
                    onSelect={() => handleFocusSoundChange('none')} 
                    icon="speaker.slash.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="Rain" 
                    soundId="rain" 
                    isSelected={focusSound === 'rain'} 
                    onSelect={() => handleFocusSoundChange('rain')} 
                    icon="cloud.rain.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="Forest" 
                    soundId="forest" 
                    isSelected={focusSound === 'forest'} 
                    onSelect={() => handleFocusSoundChange('forest')} 
                    icon="leaf.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="White Noise" 
                    soundId="white_noise" 
                    isSelected={focusSound === 'white_noise'} 
                    onSelect={() => handleFocusSoundChange('white_noise')} 
                    icon="waveform.path.ecg" 
                />
                
                {backgroundCustomSounds.map((sound) => (
                    <React.Fragment key={sound.id}>
                        <View style={styles.separator} />
                        <SoundRow 
                            label={sound.name}
                            soundId={sound.uri} // Use URI for custom preview ID logic
                            isSelected={focusSound === 'custom' && selectedBackgroundSoundId === sound.id}
                            onSelect={() => handleSelectCustomSound(sound.id, 'background')}
                            icon="music.note"
                            isCustom={true}
                            customSoundId={sound.id}
                        />
                    </React.Fragment>
                ))}

                <View style={styles.separator} />
                <TouchableOpacity onPress={() => handleUploadSound('background')} disabled={isUploading}>
                    <View style={styles.row}>
                        <Text style={{ color: '#007AFF', fontSize: 17 }}>Add Background Sound...</Text>
                    </View>
                </TouchableOpacity>
            </GlassView>
        </View>

        <View style={{ marginTop: 30 }}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>ALARM SOUND (TIMER END)</Text>
            <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
                <SoundRow 
                    label="Off" 
                    soundId="none" 
                    isSelected={ambientSound === 'none'} 
                    onSelect={() => handleSoundChange('none')} 
                    icon="bell.slash.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="Slot Machine" 
                    soundId="slot_machine" 
                    isSelected={ambientSound === 'slot_machine'} 
                    onSelect={() => handleSoundChange('slot_machine')} 
                    icon="gamecontroller.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="Rain" 
                    soundId="rain" 
                    isSelected={ambientSound === 'rain'} 
                    onSelect={() => handleSoundChange('rain')} 
                    icon="cloud.rain.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="Forest" 
                    soundId="forest" 
                    isSelected={ambientSound === 'forest'} 
                    onSelect={() => handleSoundChange('forest')} 
                    icon="leaf.fill" 
                />
                <View style={styles.separator} />
                <SoundRow 
                    label="White Noise" 
                    soundId="white_noise" 
                    isSelected={ambientSound === 'white_noise'} 
                    onSelect={() => handleSoundChange('white_noise')} 
                    icon="waveform.path.ecg" 
                />

                {alarmCustomSounds.map((sound) => (
                    <React.Fragment key={sound.id}>
                        <View style={styles.separator} />
                        <SoundRow 
                            label={sound.name}
                            soundId={sound.uri}
                            isSelected={ambientSound === 'custom' && selectedAlarmSoundId === sound.id}
                            onSelect={() => handleSelectCustomSound(sound.id, 'alarm')}
                            icon="music.note"
                            isCustom={true}
                            customSoundId={sound.id}
                        />
                    </React.Fragment>
                ))}

                <View style={styles.separator} />
                <TouchableOpacity onPress={() => handleUploadSound('alarm')} disabled={isUploading}>
                    <View style={styles.row}>
                        <Text style={{ color: '#007AFF', fontSize: 17 }}>Add Alarm Sound...</Text>
                    </View>
                </TouchableOpacity>
            </GlassView>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>MANAGE PROFILES</Text>
          <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
             {profiles.map((profile, index) => {
                 const isDefault = DEFAULT_PROFILES.some(p => p.id === profile.id);
                 return (
                 <React.Fragment key={profile.id}>
                    {index > 0 && <View style={styles.separator} />}
                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.rowText, { color: textColor }]}>{profile.name}</Text>
                            <Text style={{ color: secondaryTextColor, fontSize: 14 }}>
                                {profile.workDuration}/{profile.breakDuration}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {!isDefault && (
                                <TouchableOpacity onPress={() => handleDeleteProfile(profile.id, profile.name)}>
                                    <SymbolView name="trash" tintColor="#FF3B30" size={16} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                 </React.Fragment>
             )})}
          </GlassView>

          <Text style={[styles.sectionTitle, { color: secondaryTextColor, marginTop: 24 }]}>CUSTOM FILES</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
             <GlassView style={[styles.section, { padding: 18, alignItems: 'center' }]} intensity={isDark ? 30 : 50}>
                <Text style={{ color: '#007AFF', fontSize: 17, fontWeight: '600' }}>Add Custom Profile...</Text>
             </GlassView>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 30 }}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>ABOUT</Text>
            <GlassView style={styles.section} intensity={isDark ? 30 : 50}>
                <View style={styles.row}>
                <Text style={[styles.rowText, { color: textColor }]}>Version</Text>
                <Text style={{ color: secondaryTextColor }}>1.0.0 (iOS 26)</Text>
                </View>
            </GlassView>
        </View>
      </ScrollView>

      {/* Add Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>New Profile</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <SymbolView name="xmark.circle.fill" tintColor={secondaryTextColor} size={28} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.formContainer}>
                    <Text style={[styles.inputLabel, { color: secondaryTextColor }]}>PROFILE NAME</Text>
                    <TextInput 
                        placeholder="e.g. Project A" 
                        placeholderTextColor={secondaryTextColor}
                        style={[styles.modalInput, { color: textColor, backgroundColor: inputBackgroundColor }]}
                        value={newProfileName}
                        onChangeText={setNewProfileName}
                        maxLength={20}
                        autoFocus
                    />

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { color: secondaryTextColor }]}>WORK (MIN)</Text>
                            <TextInput 
                                placeholder="25" 
                                placeholderTextColor={secondaryTextColor}
                                style={[styles.modalInput, { color: textColor, backgroundColor: inputBackgroundColor }]}
                                keyboardType="number-pad"
                                value={newWorkDuration}
                                onChangeText={setNewWorkDuration}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { color: secondaryTextColor }]}>BREAK (MIN)</Text>
                            <TextInput 
                                placeholder="5" 
                                placeholderTextColor={secondaryTextColor}
                                style={[styles.modalInput, { color: textColor, backgroundColor: inputBackgroundColor }]}
                                keyboardType="number-pad"
                                value={newBreakDuration}
                                onChangeText={setNewBreakDuration}
                            />
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleAddProfile} style={[styles.addButton, { marginTop: 30 }]}>
                        <Text style={styles.addButtonText}>Create Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    // Add extra padding to ensure content clears the floating tab bar
    paddingBottom: 120,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    letterSpacing: -1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  row: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 54,
  },
  input: {
      padding: 12,
      borderRadius: 10,
      fontSize: 16,
  },
  addButton: {
      marginTop: 14,
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
  },
  addButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
  },
  modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingTop: 8,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 10,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  closeButton: {
      padding: 4,
  },
  formContainer: {
      gap: 16,
  },
  inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
      marginLeft: 4,
      opacity: 0.8,
  },
  modalInput: {
      padding: 16,
      borderRadius: 14,
      fontSize: 17,
  }
});
