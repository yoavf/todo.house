import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { useDragDrop } from './DragDropContext';
import { SwipeableTaskCard } from './SwipeableTaskCard';

// Constants
const TASK_CARD_HEIGHT = 80; // Approximate height of a task card

interface DraggableTaskCardProps {
  task: Task;
  index: number;
  isDragEnabled?: boolean;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  index,
  isDragEnabled = true
}) => {
  const { reorderTasks, getActiveTasks } = useTaskStore();
  const { isDragging: globalIsDragging, draggedIndex, dropTargetIndex } = useDragDrop();

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const handleDragStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number, displacement: number) => {
    const activeTasks = getActiveTasks();
    const maxIndex = Math.max(0, activeTasks.length - 1);

    // Use same threshold logic as visual feedback
    let calculatedToIndex = fromIndex;

    if (displacement > 0.75 * TASK_CARD_HEIGHT) {
      calculatedToIndex = fromIndex + Math.floor(displacement / TASK_CARD_HEIGHT);
    } else if (displacement < -0.75 * TASK_CARD_HEIGHT) {
      calculatedToIndex = fromIndex + Math.ceil(displacement / TASK_CARD_HEIGHT);
    }

    calculatedToIndex = Math.max(0, Math.min(calculatedToIndex, maxIndex));

    if (fromIndex !== calculatedToIndex) {
      reorderTasks(fromIndex, calculatedToIndex);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [reorderTasks, getActiveTasks]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleDragStart)();
      globalIsDragging.value = true;
      draggedIndex.value = index;
      scale.value = withSpring(1.05);
      zIndex.value = 1000;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (globalIsDragging.value && draggedIndex.value === index) {
        translateY.value = event.translationY;

        // Calculate potential drop target index with threshold for activation
        const displacement = event.translationY;
        let potentialIndex = -1; // Default to no drop zone active

        // Only activate drop zone when more than 75% over adjacent task
        if (displacement > 0.75 * TASK_CARD_HEIGHT) {
          // Dragging down - activate drop zone at next position
          potentialIndex = index + Math.floor(displacement / TASK_CARD_HEIGHT);
        } else if (displacement < -0.75 * TASK_CARD_HEIGHT) {
          // Dragging up - activate drop zone at previous position
          potentialIndex = index + Math.ceil(displacement / TASK_CARD_HEIGHT);
        }

        dropTargetIndex.value = potentialIndex;
      }
    })
    .onEnd((event) => {
      if (globalIsDragging.value && draggedIndex.value === index) {
        const displacement = event.translationY;

        runOnJS(handleDragEnd)(index, dropTargetIndex.value, displacement);

        // Reset values
        globalIsDragging.value = false;
        draggedIndex.value = -1;
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        zIndex.value = 0;
        dropTargetIndex.value = -1;
      }
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const isBeingDragged = globalIsDragging.value && draggedIndex.value === index;

    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      elevation: isBeingDragged ? 10 : 2,
      opacity: isBeingDragged ? 0.9 : 1,
    };
  });

  if (!isDragEnabled) {
    return <SwipeableTaskCard task={task} index={index} />;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SwipeableTaskCard task={task} index={index} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});