import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { InlineTextEdit } from './InlineTextEdit';
import { LocationPicker } from './LocationPicker';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
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
              <Ionicons name="checkmark" size={16} color="white" />
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

          {/* Date */}
          <Text style={[styles.date, task.completed && styles.completedText]}>
            {formatDate(task.createdAt)}
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
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
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  completedCard: {
    opacity: 0.6,
  },
  recentlyAddedCard: {
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.2,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  locationContainer: {
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6c757d',
  },
  addLocation: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  completedText: {
    color: '#adb5bd',
  },
  date: {
    fontSize: 12,
    color: '#adb5bd',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  newBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});