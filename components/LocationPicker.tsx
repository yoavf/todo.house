import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTaskStore } from '../store/taskStore';

interface LocationPickerProps {
  visible: boolean;
  currentLocation?: string;
  onSelect: (location: string) => void;
  onClose: () => void;
  testID?: string;
}

export function LocationPicker({ visible, currentLocation, onSelect, onClose, testID }: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(currentLocation || '');
  const tasks = useTaskStore((state) => state.tasks);

  // Get unique existing locations
  const existingLocations = useMemo(() => {
    const locations = tasks
      .map(task => task.location)
      .filter((location): location is string => Boolean(location))
      .filter((location, index, arr) => arr.indexOf(location) === index)
      .sort();
    return locations;
  }, [tasks]);

  // Filter locations based on input
  const filteredLocations = useMemo(() => {
    if (!inputValue.trim()) return existingLocations;
    return existingLocations.filter(location =>
      location.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [existingLocations, inputValue]);

  const handleSelectLocation = useCallback((location: string) => {
    onSelect(location);
  }, [onSelect]);

  const handleSubmitInput = useCallback(() => {
    if (inputValue.trim()) {
      onSelect(inputValue.trim());
    }
  }, [inputValue, onSelect]);

  const handleRemoveLocation = useCallback(() => {
    onSelect('');
  }, [onSelect]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Location</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Type a location..."
            returnKeyType="done"
            onSubmitEditing={handleSubmitInput}
          />
          {inputValue.trim() && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSubmitInput}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Remove Location Option */}
        {currentLocation && (
          <TouchableOpacity
            style={styles.removeOption}
            onPress={handleRemoveLocation}
          >
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.removeText}>Remove location</Text>
          </TouchableOpacity>
        )}

        {/* Existing Locations */}
        <Text style={styles.sectionTitle}>Recent Locations</Text>
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleSelectLocation(item)}
            >
              <Ionicons name="location-outline" size={20} color="#6c757d" />
              <Text style={styles.locationText}>{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {inputValue.trim() ? 'No matching locations' : 'No locations yet'}
            </Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  removeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  removeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#dc3545',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  locationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  emptyText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 14,
    marginTop: 20,
  },
});