import { Ionicons } from '@expo/vector-icons'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Task } from '../types/Task'
import { TaskPlaceholderImage } from './TaskPlaceholderImage'

interface TaskCardLargeProps {
  task: Task
  onPress: () => void
}

export function TaskCardLarge({ task, onPress }: TaskCardLargeProps) {
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

  const getRoomColor = (room?: string) => {
    switch (room) {
      case 'Kitchen':
        return '#007bff'
      case 'Bedroom':
        return '#6f42c1'
      case 'Bathroom':
        return '#17a2b8'
      case 'Living Room':
        return '#fd7e14'
      case 'Office':
        return '#20c997'
      default:
        return '#6c757d'
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, task.completed && styles.completedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Large Image */}
      <View style={styles.imageContainer}>
        {task.imageUri ? (
          <Image
            source={{ uri: task.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <TaskPlaceholderImage size={100} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, task.completed && styles.completedTitle]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description && (
          <Text
            style={[styles.description, task.completed && styles.completedText]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}

        {/* Tags */}
        <View style={styles.tags}>
          {task.estimatedTime && (
            <View style={styles.tag}>
              <Ionicons name="time-outline" size={14} color="#6c757d" />
              <Text style={styles.tagText}>{task.estimatedTime}</Text>
            </View>
          )}

          {task.effort && (
            <View
              style={[
                styles.tag,
                { backgroundColor: `${getEffortColor(task.effort)}15` },
              ]}
            >
              <Ionicons
                name="speedometer-outline"
                size={14}
                color={getEffortColor(task.effort)}
              />
              <Text
                style={[styles.tagText, { color: getEffortColor(task.effort) }]}
              >
                {task.effort}
              </Text>
            </View>
          )}

          {task.location && (
            <View
              style={[
                styles.tag,
                { backgroundColor: `${getRoomColor(task.location)}15` },
              ]}
            >
              <Text
                style={[styles.tagText, { color: getRoomColor(task.location) }]}
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
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: 200,
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 22,
  },
  completedText: {
    color: '#adb5bd',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
})
