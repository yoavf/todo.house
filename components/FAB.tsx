import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter, useSegments } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FAB as PaperFAB, Portal } from 'react-native-paper';
import { useTaskStore } from '../store/taskStore';
import { LocationPicker } from './LocationPicker';

export function FAB() {
  const router = useRouter();
  const segments = useSegments();
  const [isOpen, setIsOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { add } = useTaskStore();

  // Check if camera is open
  const isCameraOpen = segments.includes('camera');

  // Check if bottom sheet is open
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Hide FAB when camera or bottom sheet is open
  const shouldHideFAB = isCameraOpen || isBottomSheetOpen;

  const handleCamera = useCallback(() => {
    setIsOpen(false);
    router.push('/camera');
  }, [router]);

  const handleVoice = useCallback(() => {
    setIsOpen(false);
    // Voice feature to be implemented
    console.log('Voice feature to be implemented');
  }, []);

  const handleType = useCallback(() => {
    setIsOpen(false);
    setIsBottomSheetOpen(true);
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

  const handleBottomSheetChange = useCallback((index: number) => {
    setIsBottomSheetOpen(index >= 0);
  }, []);

  return (
    <>
      <Portal>
        <PaperFAB.Group
          open={isOpen}
          visible={!shouldHideFAB}
          icon={isOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'camera',
              label: 'Camera',
              onPress: handleCamera,
              style: { backgroundColor: '#3b82f6' },
            },
            {
              icon: 'microphone',
              label: 'Voice',
              onPress: handleVoice,
              style: { backgroundColor: '#8b5cf6' },
            },
            {
              icon: 'pencil',
              label: 'Type',
              onPress: handleType,
              style: { backgroundColor: '#10b981' },
            },
          ]}
          onStateChange={({ open }) => setIsOpen(open)}
          onPress={() => {
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          style={styles.fab}
          fabStyle={styles.fabButton}
          color="white"
        />
      </Portal>

      {/* Bottom Sheet for Type/Form */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['50%']}
        backgroundStyle={styles.bottomSheet}
        onChange={handleBottomSheetChange}
        onDismiss={() => setIsBottomSheetOpen(false)}
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
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Description</Text>
              <BottomSheetTextInput
                style={styles.textInput}
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
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
            </View>

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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fabButton: {
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
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