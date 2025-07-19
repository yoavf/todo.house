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
const CARD_WIDTH = SCREEN_WIDTH - 48 // Full width minus padding
const CARD_HEIGHT = 440

export function TaskCardLarge({ task, onPress }: TaskCardLargeProps) {
  const getEffortStyle = (effort?: string) => {
    switch (effort) {
      case 'Easy':
        return {
          bg: 'rgba(16, 185, 129, 0.2)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#10b981',
        }
      case 'Medium':
        return {
          bg: 'rgba(251, 191, 36, 0.2)',
          border: 'rgba(251, 191, 36, 0.3)',
          text: '#fbbf24',
        }
      case 'Hard':
        return {
          bg: 'rgba(239, 68, 68, 0.2)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#ef4444',
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
          bg: 'rgba(59, 130, 246, 0.2)',
          border: 'rgba(59, 130, 246, 0.3)',
          text: '#3b82f6',
        }
      case 'Bedroom':
        return {
          bg: 'rgba(139, 92, 246, 0.2)',
          border: 'rgba(139, 92, 246, 0.3)',
          text: '#8b5cf6',
        }
      case 'Bathroom':
        return {
          bg: 'rgba(6, 182, 212, 0.2)',
          border: 'rgba(6, 182, 212, 0.3)',
          text: '#06b6d4',
        }
      case 'Living Room':
        return {
          bg: 'rgba(249, 115, 22, 0.2)',
          border: 'rgba(249, 115, 22, 0.3)',
          text: '#f97316',
        }
      case 'Office':
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.3)',
          text: '#6b7280',
        }
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.2)',
          border: 'rgba(99, 102, 241, 0.3)',
          text: '#6366f1',
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
            'rgba(0, 0, 0, 0.1)',
            'rgba(0, 0, 0, 0.3)',
            'rgba(0, 0, 0, 0.5)',
            'rgba(0, 0, 0, 0.7)',
          ]}
          locations={[0, 0.4, 0.6, 0.7, 0.85, 1]}
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
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text
              style={[
                styles.description,
                task.completed && styles.completedText,
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
        </View>

        {/* Pills */}
        <View style={styles.pillsContainer}>
          {/* Time Pill */}
          {task.estimatedTime && (
            <View style={[styles.pill, styles.timePill]}>
              <Ionicons name="time-outline" size={12} color="#ffffff" />
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
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
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
    backgroundColor: '#2a2a2a',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  textContent: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  description: {
    fontSize: 16,
    color: '#e5e5e5',
    lineHeight: 22,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  completedText: {
    color: '#9ca3af',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  timePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
})
