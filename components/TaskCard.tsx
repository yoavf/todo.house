import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Image, Modal } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { InlineTextEdit } from './InlineTextEdit';
import { LocationPicker } from './LocationPicker';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { toggle, remove, update, recentlyAddedId, clearRecentlyAdded } = useTaskStore();
  const isRecentlyAdded = recentlyAddedId === task.id;

  // Clear the recently added highlight after a delay
  useEffect(() => {
    if (isRecentlyAdded) {
      const timer = setTimeout(() => {
        clearRecentlyAdded();
      }, 3000); // Show highlight for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isRecentlyAdded, clearRecentlyAdded]);

  const handleToggleComplete = () => {
    toggle(task.id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
      ]
    );
  };

  const handleTitleUpdate = (newTitle: string) => {
    if (newTitle.trim() !== task.title) {
      update(task.id, { title: newTitle.trim() });
    }
  };

  const handleLocationUpdate = (newLocation: string) => {
    update(task.id, { location: newLocation || undefined });
    setShowLocationPicker(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <>
      <View style={[
        styles.card,
        task.completed && styles.completedCard,
        isRecentlyAdded && styles.recentlyAddedCard
      ]}>
        {/* Completion Checkbox */}
        <TouchableOpacity
          onPress={handleToggleComplete}
          style={styles.checkboxContainer}
        >
          <View style={[styles.checkbox, task.completed && styles.checkedCheckbox]}>
            {task.completed && (
              <Ionicons name="checkmark" size={18} color="white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Task Content */}
        <View style={styles.content}>
          {/* Title */}
          <InlineTextEdit
            value={task.title}
            onUpdate={handleTitleUpdate}
            style={task.completed ? [styles.title, styles.completedTitle] : styles.title}
            placeholder="Task title"
          />

          {/* Location */}
          <TouchableOpacity
            onPress={() => setShowLocationPicker(true)}
            style={styles.locationContainer}
          >
            {task.location ? (
              <Text style={[styles.location, task.completed && styles.completedText]}>
                in {task.location}
              </Text>
            ) : (
              <Text style={styles.addLocation}>Add location</Text>
            )}
          </TouchableOpacity>

          {/* Image thumbnail if available */}
          {task.imageUri && (
            <TouchableOpacity 
              onPress={() => setShowImageModal(true)}
              style={styles.imageContainer}
            >
              <Image 
                source={{ uri: task.imageUri }} 
                style={styles.imageThumbnail}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={16} color="white" />
              </View>
            </TouchableOpacity>
          )}

          {/* Date */}
          <Text style={[styles.date, task.completed && styles.completedText]}>
            {formatDate(task.createdAt)}
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>

        {/* Recently Added Indicator */}
        {isRecentlyAdded && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        currentLocation={task.location}
        onSelect={handleLocationUpdate}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Image Modal */}
      {task.imageUri && (
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity 
              style={styles.imageModalBackdrop}
              onPress={() => setShowImageModal(false)}
            >
              <View style={styles.imageModalContent}>
                <Image 
                  source={{ uri: task.imageUri }} 
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={styles.imageModalClose}
                  onPress={() => setShowImageModal(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#FAFAFA',
  },
  recentlyAddedCard: {
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  checkboxContainer: {
    marginRight: 16,
    marginTop: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  checkedCheckbox: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  locationContainer: {
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addLocation: {
    fontSize: 14,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  completedText: {
    color: '#D1D5DB',
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  imageModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});