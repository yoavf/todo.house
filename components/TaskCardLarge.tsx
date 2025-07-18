import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import type { Task } from '../types/Task'
import { TaskPlaceholderImage } from './TaskPlaceholderImage'

interface TaskCardLargeProps {
  task: Task
  onPress: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = Math.min(320, SCREEN_WIDTH - 48) // Max 320px or screen width minus padding
const CARD_HEIGHT = 380

export function TaskCardLarge({ task, onPress }: TaskCardLargeProps) {
  const getEffortStyle = (effort?: string) => {
    switch (effort) {
      case 'Easy':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#047857',
        }
      case 'Medium':
        return {
          bg: 'rgba(251, 191, 36, 0.15)',
          border: 'rgba(251, 191, 36, 0.3)',
          text: '#92400e',
        }
      case 'Hard':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#991b1b',
        }
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.15)',
          border: 'rgba(107, 114, 128, 0.3)',
          text: '#374151',
        }
    }
  }

  const getCategoryStyle = (category?: string) => {
    switch (category) {
      case 'Kitchen':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
          text: '#1e40af',
        }
      case 'Bedroom':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          border: 'rgba(139, 92, 246, 0.3)',
          text: '#5b21b6',
        }
      case 'Bathroom':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.3)',
          text: '#0e7490',
        }
      case 'Living Room':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          border: 'rgba(249, 115, 22, 0.3)',
          text: '#c2410c',
        }
      case 'Office':
        return {
          bg: 'rgba(107, 114, 128, 0.15)',
          border: 'rgba(107, 114, 128, 0.3)',
          text: '#374151',
        }
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.15)',
          border: 'rgba(99, 102, 241, 0.3)',
          text: '#4c1d95',
        }
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, task.completed && styles.completedCard]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Background Image with Gradient Overlay */}
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
            'transparent',
            'transparent',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0.8)',
            'rgba(255, 255, 255, 0.95)',
            '#ffffff',
          ]}
          locations={[0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1]}
          style={styles.gradient}
        />
      </View>

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Spacer to push content to bottom */}
        <View style={{ flex: 1 }} />

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text
            style={[styles.title, task.completed && styles.completedTitle]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text
            style={[styles.description, task.completed && styles.completedText]}
            numberOfLines={2}
          >
            {task.description ||
              `${task.effort || 'Moderate'} task${
                task.location ? ` in the ${task.location}` : ''
              }`}
          </Text>
        </View>

        {/* Pills */}
        <View style={styles.pillsContainer}>
          {/* Time Pill */}
          {task.estimatedTime && (
            <View style={[styles.pill, styles.timePill]}>
              <Ionicons name="time-outline" size={12} color="#4b5563" />
              <Text style={styles.pillText}>{task.estimatedTime}</Text>
            </View>
          )}

          {/* Effort Pill */}
          {task.effort && (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: getEffortStyle(task.effort).bg,
                  borderColor: getEffortStyle(task.effort).border,
                },
              ]}
            >
              <Ionicons
                name="speedometer-outline"
                size={12}
                color={getEffortStyle(task.effort).text}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: getEffortStyle(task.effort).text },
                ]}
              >
                {task.effort}
              </Text>
            </View>
          )}

          {/* Category Pill */}
          {task.location && (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: getCategoryStyle(task.location).bg,
                  borderColor: getCategoryStyle(task.location).border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: getCategoryStyle(task.location).text },
                ]}
              >
                {task.location}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    alignSelf: 'center',
  },
  completedCard: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  textContent: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'center',
  },
  completedText: {
    color: '#9ca3af',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
  },
  timePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
})
