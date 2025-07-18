import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { LocationPicker } from './LocationPicker';
import { useTaskStore } from '../store/taskStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SpeedDialOption {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: () => void;
}

export function FAB() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const { add } = useTaskStore();

  const handleToggle = useCallback(() => {
    if (LayoutAnimation?.configureNext) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsOpen(!isOpen);
    
    Animated.timing(rotateAnimation, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnimation]);

  const handleCamera = useCallback(() => {
    setIsOpen(false);
    router.push('/camera');
  }, [router]);

  const handleVoice = useCallback(() => {
    setIsOpen(false);
    // Voice feature to be implemented
  }, []);

  const handleType = useCallback(() => {
    setIsOpen(false);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCreateTask = useCallback(() => {
    if (newTaskTitle.trim()) {
      add({
        title: newTaskTitle.trim(),
        location: newTaskLocation || undefined,
        completed: false,
      });
      setNewTaskTitle('');
      setNewTaskLocation('');
      bottomSheetModalRef.current?.dismiss();
    }
  }, [newTaskTitle, newTaskLocation, add]);

  const speedDialOptions: SpeedDialOption[] = [
    {
      id: 'camera',
      icon: 'camera',
      label: 'Camera',
      color: '#3b82f6',
      action: handleCamera,
    },
    {
      id: 'voice',
      icon: 'mic',
      label: 'Voice',
      color: '#8b5cf6',
      action: handleVoice,
    },
    {
      id: 'type',
      icon: 'create',
      label: 'Type',
      color: '#10b981',
      action: handleType,
    },
  ];

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      <View style={styles.container}>
        {isOpen && (
          <View style={styles.speedDialContainer}>
            {speedDialOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                style={[
                  styles.speedDialItem,
                  {
                    opacity: isOpen ? 1 : 0,
                    transform: [
                      {
                        translateY: isOpen ? -(index + 1) * 70 : 0,
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.labelContainer}
                  onPress={option.action}
                  activeOpacity={0.8}
                >
                  <Text style={styles.speedDialLabel}>{option.label}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.speedDialButton, { backgroundColor: option.color }]}
                  onPress={option.action}
                  activeOpacity={0.8}
                  testID={`speed-dial-${option.id}`}
                >
                  <Ionicons name={option.icon as any} size={24} color="white" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleToggle}
          activeOpacity={0.8}
          testID="fab-button"
        >
          <LinearGradient
            colors={['#4c84ff', '#3b82f6']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={32} color="white" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Type/Form */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['50%']}
        backgroundStyle={styles.bottomSheet}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Create New Task</Text>
            <TouchableOpacity
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Task Description</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons 
                name="location-outline" 
                size={20} 
                color={newTaskLocation ? '#2c3e50' : '#adb5bd'} 
              />
              <Text style={[
                styles.locationText,
                !newTaskLocation && styles.placeholderText
              ]}>
                {newTaskLocation || 'Select a location (optional)'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, !newTaskTitle.trim() && styles.createButtonDisabled]}
              onPress={handleCreateTask}
              disabled={!newTaskTitle.trim()}
            >
              <Text style={styles.createButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        currentLocation={newTaskLocation}
        onSelect={(location) => {
          setNewTaskLocation(location);
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center',
  },
  mainButton: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedDialContainer: {
    position: 'absolute',
    bottom: 70,
    alignItems: 'center',
  },
  speedDialItem: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedDialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelContainer: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
  },
  speedDialLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#adb5bd',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});