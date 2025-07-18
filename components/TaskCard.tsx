import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTaskStore } from '../store/taskStore'
import type { Schedule, Task } from '../types/Task'
import { InlineTextEdit } from './InlineTextEdit'
import { LocationPicker } from './LocationPicker'
import { SchedulePicker } from './SchedulePicker'
import { TaskPlaceholderImage } from './TaskPlaceholderImage'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const {
    toggle,
    remove,
    update,
    setSchedule,
    recentlyAddedId,
    clearRecentlyAdded,
  } = useTaskStore()
  const isRecentlyAdded = recentlyAddedId === task.id

  // Clear the recently added highlight after a delay
  useEffect(() => {
    if (isRecentlyAdded) {
      const timer = setTimeout(() => {
        clearRecentlyAdded()
      }, 3000) // Show highlight for 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isRecentlyAdded, clearRecentlyAdded])

  const handleToggleComplete = () => {
    toggle(task.id)
  }

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
    ])
  }

  const handleTitleUpdate = (newTitle: string) => {
    if (newTitle.trim() !== task.title) {
      update(task.id, { title: newTitle.trim() })
    }
  }

  const handleLocationUpdate = (newLocation: string) => {
    update(task.id, { location: newLocation || undefined })
    setShowLocationPicker(false)
  }

  const handleScheduleUpdate = (schedule: Schedule | undefined) => {
    setSchedule(task.id, schedule)
    setShowSchedulePicker(false)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  return (
    <>
      <View
        style={[
          styles.card,
          task.completed && styles.completedCard,
          isRecentlyAdded && styles.recentlyAddedCard,
        ]}
        testID="task-card"
      >
        {/* Completion Checkbox */}
        <TouchableOpacity
          onPress={handleToggleComplete}
          style={styles.checkboxContainer}
          testID="task-checkbox"
        >
          <View
            style={[styles.checkbox, task.completed && styles.checkedCheckbox]}
          >
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
            style={
              task.completed
                ? [styles.title, styles.completedTitle]
                : styles.title
            }
            placeholder="Task title"
            testID="title-edit"
          />

          {/* Location */}
          <TouchableOpacity
            onPress={() => setShowLocationPicker(true)}
            style={styles.locationContainer}
            testID="location-button"
          >
            {task.location ? (
              <Text
                style={[
                  styles.location,
                  task.completed && styles.completedText,
                ]}
              >
                in {task.location}
              </Text>
            ) : (
              <Text style={styles.addLocation}>Add location</Text>
            )}
          </TouchableOpacity>

          {/* Schedule Button */}
          <TouchableOpacity
            onPress={() => setShowSchedulePicker(true)}
            style={styles.scheduleButton}
            testID="schedule-button"
          >
            {task.schedule ? (
              <View style={styles.scheduleButtonContent}>
                <Ionicons
                  name="repeat"
                  size={16}
                  color="#28a745"
                  style={styles.scheduleButtonIcon}
                />
                <Text style={styles.scheduleButtonTextActive}>
                  Every {task.schedule.interval} {task.schedule.frequency}
                </Text>
              </View>
            ) : (
              <View style={styles.scheduleButtonContent}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color="#adb5bd"
                  style={styles.scheduleButtonIcon}
                />
                <Text style={styles.scheduleButtonText}>Add schedule</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Image thumbnail or placeholder */}
          {task.imageUri ? (
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              style={styles.imageContainer}
              testID="image-preview"
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
          ) : (
            <View style={styles.imageContainer}>
              <TaskPlaceholderImage size={60} />
            </View>
          )}

          {/* Date */}
          <Text style={[styles.date, task.completed && styles.completedText]}>
            {formatDate(task.createdAt)}
          </Text>

          {/* Future Task Indicator */}
          {task.isFutureTask && (
            <View style={styles.scheduleIndicator}>
              <Ionicons
                name="calendar"
                size={14}
                color="#6f42c1"
                style={styles.scheduleIcon}
              />
              <Text style={styles.scheduleText}>Future</Text>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
          testID="delete-button"
        >
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
        testID="location-picker"
      />

      {/* Schedule Picker Modal */}
      <SchedulePicker
        visible={showSchedulePicker}
        onSave={handleScheduleUpdate}
        onClose={() => setShowSchedulePicker(false)}
        initialSchedule={task.schedule}
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
  )
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
  scheduleButton: {
    marginBottom: 8,
  },
  scheduleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleButtonIcon: {
    marginRight: 4,
  },
  scheduleButtonText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  scheduleButtonTextActive: {
    fontSize: 14,
    color: '#28a745',
  },
  completedText: {
    color: '#adb5bd',
  },
  date: {
    fontSize: 12,
    color: '#adb5bd',
  },
  scheduleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  scheduleIcon: {
    marginRight: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
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
})
