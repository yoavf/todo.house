import { useCallback, useEffect, useRef } from 'react'
import { DeviceEventEmitter, StyleSheet, Text, View } from 'react-native'
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist'
import { useTaskStore } from '../store/taskStore'
import type { Task } from '../types/Task'
import { DraggableTaskItem } from './DraggableTaskItem'

const TASK_CARD_HEIGHT = 80

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const { reorderTasks } = useTaskStore()
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const handleDragEnd = useCallback(
    ({ data }: { data: Task[] }) => {
      reorderTasks(data)
    },
    [reorderTasks],
  )

  const handleScroll = useCallback(() => {
    // Emit scroll event to FAB
    DeviceEventEmitter.emit('taskListScroll')

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    // Set timeout to emit scroll end
    scrollTimeout.current = setTimeout(() => {
      DeviceEventEmitter.emit('taskListScrollEnd')
    }, 2000)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => {
      return <DraggableTaskItem task={item} drag={drag} isActive={isActive} />
    },
    [],
  )

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="empty-container">
        <Text style={styles.emptyText}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the + button to add your first task
        </Text>
      </View>
    )
  }

  return (
    <DraggableFlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={handleDragEnd}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      getItemLayout={(_data, index) => ({
        length: TASK_CARD_HEIGHT, // Approximate task card height
        offset: TASK_CARD_HEIGHT * index,
        index,
      })}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 100, // Space for FAB
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
