import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { SwipeableTaskCard } from './SwipeableTaskCard';
import { useDragDrop } from './DragDropContext';

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
    const calculatedToIndex = Math.max(0, Math.min(
      Math.round(fromIndex + displacement / TASK_CARD_HEIGHT),
      maxIndex
    ));
    
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
        
        // Calculate potential drop target index
        const displacement = event.translationY;
        const potentialIndex = Math.round(index + displacement / TASK_CARD_HEIGHT);
        dropTargetIndex.value = Math.max(0, potentialIndex);
      }
    })
    .onEnd((event) => {
      if (globalIsDragging.value && draggedIndex.value === index) {
        const displacement = event.translationY;
        
        runOnJS(handleDragEnd)(index, index, displacement);
        
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