import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { Task } from '../types/Task'
import { SwipeableTaskCard } from './SwipeableTaskCard'
import { TaskCardLarge } from './TaskCardLarge'
import { TaskDetailModal } from './TaskDetailModal'
import type { TaskFilters } from './TaskFilters'

interface TaskListFilteredProps {
  tasks: Task[]
  viewMode: 'large' | 'compact'
  filters: TaskFilters
}

export function TaskListFiltered({
  tasks,
  viewMode,
  filters,
}: TaskListFilteredProps) {
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter by time
      if (filters.time?.length && task.estimatedTime) {
        if (!filters.time.includes(task.estimatedTime)) return false
      }

      // Filter by room
      if (filters.room?.length && task.location) {
        if (!filters.room.includes(task.location)) return false
      }

      // Filter by effort
      if (filters.effort?.length && task.effort) {
        if (!filters.effort.includes(task.effort)) return false
      }

      return true
    })
  }, [tasks, filters])

  const handleScroll = useCallback(() => {
    DeviceEventEmitter.emit('taskListScroll')

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    scrollTimeout.current = setTimeout(() => {
      DeviceEventEmitter.emit('taskListScrollEnd')
    }, 2000)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  const handleTaskPress = useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: Task }) => {
      if (viewMode === 'large') {
        return (
          <TaskCardLarge task={item} onPress={() => handleTaskPress(item)} />
        )
      }
      return (
        <SwipeableTaskCard task={item} onPress={() => handleTaskPress(item)} />
      )
    },
    [viewMode, handleTaskPress],
  )

  if (filteredTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
        </Text>
        <Text style={styles.emptySubtext}>
          {tasks.length === 0
            ? 'Tap the + button to add your first task'
            : 'Try adjusting your filters'}
        </Text>
      </View>
    )
  }

  return (
    <>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      <TaskDetailModal
        visible={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
})
