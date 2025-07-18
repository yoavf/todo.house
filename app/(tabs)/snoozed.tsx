import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TaskCard } from '../../components/TaskCard'
import { getSnoozedTasks, useTaskStore } from '../../store/taskStore'
import {
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
} from '../../utils/constants'
import { getRandomWheneverLabel } from '../../utils/dateUtils'

export default function SnoozedScreen() {
  const tasks = useTaskStore((state) => state.tasks)
  const unsnoozeTask = useTaskStore((state) => state.unsnoozeTask)

  const snoozedTasks = useMemo(() => getSnoozedTasks(tasks), [tasks])

  const formatTimeRemaining = (snoozeUntil?: Date): string => {
    if (!snoozeUntil) return getRandomWheneverLabel()

    const now = new Date()
    const diff = snoozeUntil.getTime() - now.getTime()

    if (diff <= 0) return 'Ready to unsnooze'

    const hours = Math.floor(diff / MILLISECONDS_PER_HOUR)
    const minutes = Math.floor(
      (diff % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE,
    )
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  const handleUnsnooze = (taskId: string) => {
    unsnoozeTask(taskId)
  }

  if (snoozedTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="time" size={64} color="#adb5bd" />
          <Text style={styles.emptyTitle}>No Snoozed Tasks</Text>
          <Text style={styles.emptyDescription}>
            Tasks you snooze will appear here until their snooze time expires.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Tasks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Snoozed Tasks</Text>
          <Text style={styles.count}>
            {snoozedTasks.length} task{snoozedTasks.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.taskList}>
          {snoozedTasks.map((task) => (
            <View key={task.id} style={styles.taskContainer}>
              <View style={styles.taskCard}>
                <TaskCard task={task} />
              </View>

              <View style={styles.snoozeInfo}>
                <Text style={styles.timeRemaining}>
                  {formatTimeRemaining(task.snoozeUntil)}
                </Text>
                <TouchableOpacity
                  style={styles.unsnoozeButton}
                  onPress={() => handleUnsnooze(task.id)}
                >
                  <Ionicons name="alarm-outline" size={16} color="#007bff" />
                  <Text style={styles.unsnoozeText}>Unsnooze</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
  count: {
    fontSize: 16,
    color: '#6c757d',
  },
  taskList: {
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  taskContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  taskCard: {
    opacity: 0.7,
  },
  snoozeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  unsnoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  unsnoozeText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    marginLeft: 4,
  },
})
