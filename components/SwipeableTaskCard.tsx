import { Ionicons } from '@expo/vector-icons'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import type React from 'react'
import { useCallback, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import SwipeableItem from 'react-native-swipeable-item'
import { useTaskStore } from '../store/taskStore'
import type { Task } from '../types/Task'
import { SnoozeActionSheet } from './SnoozeActionSheet'
import { TaskCard } from './TaskCard'

interface SwipeableTaskCardProps {
  task: Task
  drag?: () => void
  isActive?: boolean
  onPress?: () => void
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  drag,
  isActive = false,
  onPress,
}) => {
  const remove = useTaskStore((state) => state.remove)
  const toggle = useTaskStore((state) => state.toggle)
  const snoozeSheetRef = useRef<BottomSheetModal>(null)

  const handleComplete = useCallback(() => {
    toggle(task.id)
  }, [toggle, task.id])

  const handleSnooze = useCallback(() => {
    snoozeSheetRef.current?.present()
  }, [])

  const handleDelete = useCallback(() => {
    remove(task.id)
  }, [remove, task.id])

  const renderUnderlayLeft = useCallback(
    () => (
      <View style={styles.leftUnderlayContainer}>
        <View style={styles.underlaySpace} />
        <View style={styles.completeButtonWrapper}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.7}
            delayPressIn={0}
            accessibilityLabel={
              task.completed ? 'Undo task completion' : 'Mark task as complete'
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={task.completed ? 'arrow-undo' : 'checkmark'}
              size={24}
              color="white"
            />
            <Text style={styles.actionText}>
              {task.completed ? 'Undo' : 'Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleComplete, task.completed],
  )

  const renderUnderlayRight = useCallback(
    () => (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.snoozeButton}
          onPress={handleSnooze}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Ionicons name="time" size={20} color="white" />
          <Text style={styles.actionText}>Snooze</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleSnooze, handleDelete],
  )

  return (
    <View
      style={[styles.container, { opacity: isActive ? 0.8 : 1 }]}
      testID="swipeable-container"
    >
      <SwipeableItem
        item={task}
        renderUnderlayLeft={renderUnderlayLeft}
        renderUnderlayRight={renderUnderlayRight}
        snapPointsLeft={[100]}
        snapPointsRight={[160]}
        activationThreshold={5}
        swipeEnabled={true}
      >
        <TouchableOpacity
          style={styles.taskCard}
          onPress={onPress}
          activeOpacity={0.95}
          disabled={!onPress}
        >
          <View style={styles.taskContent}>
            <TaskCard task={task} />
          </View>
          {drag && (
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={300}
              disabled={isActive}
              style={styles.dragHandle}
              activeOpacity={0.6}
              testID="drag-handle"
            >
              <Ionicons name="reorder-three" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </SwipeableItem>

      <SnoozeActionSheet
        bottomSheetRef={snoozeSheetRef}
        taskId={task.id}
        onClose={() => snoozeSheetRef.current?.dismiss()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  dragHandle: {
    padding: 12,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftUnderlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  underlaySpace: {
    flex: 1,
  },
  completeButtonWrapper: {
    width: 100,
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    height: '100%',
    width: 160,
  },
  completeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#28a745',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  snoozeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
})
