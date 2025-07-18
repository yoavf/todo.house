import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
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

  const getEffortStyle = (effort?: string) => {
    switch (effort) {
      case 'Easy':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#047857' }
      case 'Medium':
        return { bg: 'rgba(251, 191, 36, 0.2)', text: '#92400e' }
      case 'Hard':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#991b1b' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#374151' }
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
          {/* Image with Header Overlay */}
          <View style={styles.imageSection}>
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
              {/* Gradient Overlay */}
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 0.3)',
                  'transparent',
                  'transparent',
                  'rgba(0, 0, 0, 0.4)',
                ]}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.imageGradient}
              />
            </View>

            {/* Header with Back Button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Title Overlay on Image */}
            <View style={styles.imageOverlay}>
              <Text style={styles.overlayTitle}>{task.title}</Text>
              <View style={styles.overlayTags}>
                {task.estimatedTime && (
                  <View style={styles.overlayTag}>
                    <Ionicons name="time-outline" size={14} color="white" />
                    <Text style={styles.overlayTagText}>
                      {task.estimatedTime}
                    </Text>
                  </View>
                )}
                {task.effort && (
                  <View style={styles.overlayTag}>
                    <Ionicons
                      name="speedometer-outline"
                      size={14}
                      color="white"
                    />
                    <Text style={styles.overlayTagText}>{task.effort}</Text>
                  </View>
                )}
                {task.location && (
                  <View style={styles.overlayTag}>
                    <Text style={styles.overlayTagText}>{task.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
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
                        backgroundColor: `${getEffortStyle(task.effort).bg}`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color={getEffortStyle(task.effort).text}
                    />
                    <Text
                      style={[
                        styles.tagText,
                        { color: getEffortStyle(task.effort).text },
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
    flex: 1,
    backgroundColor: 'white',
  },
  imageSection: {
    height: SCREEN_HEIGHT * 0.5,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  overlayTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overlayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  overlayTagText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
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
    backgroundColor: '#10b981',
  },
  snoozeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
})
