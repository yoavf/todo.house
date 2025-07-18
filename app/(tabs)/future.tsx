import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TaskList } from '../../components'
import { getFutureTasks, useTaskStore } from '../../store/taskStore'

export default function FutureTasksScreen() {
  const tasks = useTaskStore((state) => state.tasks)

  const futureTasks = useMemo(() => getFutureTasks(tasks), [tasks])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Tasks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Future Tasks</Text>
        </View>

        {/* Task List */}
        <TaskList tasks={futureTasks} />

        {/* Empty state */}
        {futureTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No future tasks yet. Complete a scheduled task to see future
              occurrences here.
            </Text>
          </View>
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
})
