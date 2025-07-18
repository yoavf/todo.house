import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTaskStore } from '../store/taskStore'
import type { Task } from '../types/Task'
import { TaskPlaceholderImage } from './TaskPlaceholderImage'

interface TaskDetailModalProps {
  visible: boolean
  task: Task | null
  onClose: () => void
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export function TaskDetailModal({
  visible,
  task,
  onClose,
}: TaskDetailModalProps) {
  const insets = useSafeAreaInsets()
  const { toggle, snooze } = useTaskStore()
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, slideAnim])

  if (!task) return null

  const handleComplete = () => {
    toggle(task.id)
    setTimeout(onClose, 500)
  }

  const handleSnooze = () => {
    // This would open the snooze picker
    // For now, just snooze until tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    snooze(task.id, tomorrow)
    onClose()
  }

  const getEffortColor = (effort?: string) => {
    switch (effort) {
      case 'Easy':
        return '#28a745'
      case 'Medium':
        return '#ffc107'
      case 'Hard':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image */}
            <View style={styles.imageContainer}>
              {task.imageUri ? (
                <Image
                  source={{ uri: task.imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <TaskPlaceholderImage size={150} />
                </View>
              )}
            </View>

            {/* Title and tags */}
            <View style={styles.content}>
              <Text style={styles.title}>{task.title}</Text>

              <View style={styles.tags}>
                {task.estimatedTime && (
                  <View style={styles.tag}>
                    <Ionicons name="time-outline" size={16} color="#6c757d" />
                    <Text style={styles.tagText}>{task.estimatedTime}</Text>
                  </View>
                )}

                {task.effort && (
                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor: `${getEffortColor(task.effort)}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color={getEffortColor(task.effort)}
                    />
                    <Text
                      style={[
                        styles.tagText,
                        { color: getEffortColor(task.effort) },
                      ]}
                    >
                      {task.effort}
                    </Text>
                  </View>
                )}

                {task.location && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{task.location}</Text>
                  </View>
                )}
              </View>

              {/* Task Details */}
              <View style={styles.details}>
                <Text style={styles.detailsTitle}>Task Details</Text>
                <Text style={styles.detailsText}>
                  {task.description ||
                    `A thorough ${
                      task.effort?.toLowerCase() || 'moderate'
                    } task that ${
                      task.estimatedTime
                        ? `takes approximately ${task.estimatedTime}`
                        : 'requires your attention'
                    }${
                      task.location ? ` in the ${task.location}` : ''
                    }. This task helps maintain ${
                      task.location
                        ? `your ${task.location.toLowerCase()}`
                        : 'your home'
                    } in excellent condition.`}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.actionButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={handleSnooze}
            >
              <Ionicons name="time-outline" size={24} color="#2c3e50" />
              <Text style={[styles.actionButtonText, { color: '#2c3e50' }]}>
                Snooze Task
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#6c757d',
  },
  details: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  actions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  snoozeButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
})
