import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { SimpleSwipeableTaskCard } from './SimpleSwipeableTaskCard';

interface SimpleDraggableTaskCardProps {
  task: Task;
  index: number;
  isDragEnabled?: boolean;
}

export const SimpleDraggableTaskCard: React.FC<SimpleDraggableTaskCardProps> = ({ 
  task, 
  index, 
  isDragEnabled = true 
}) => {
  const { reorderTasks } = useTaskStore();

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const handleDragStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [index]);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      reorderTasks(fromIndex, toIndex);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [reorderTasks]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleDragStart)();
      isDragging.value = true;
      scale.value = withSpring(1.05);
      zIndex.value = 1000;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isDragging.value) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (isDragging.value) {
        const displacement = event.translationY;
        const itemHeight = 80; // Approximate height of a task card
        const newIndex = Math.max(0, Math.min(
          Math.round(index + displacement / itemHeight),
          10 // Max reasonable number of tasks
        ));
        
        runOnJS(handleDragEnd)(index, newIndex);
        
        // Reset values
        isDragging.value = false;
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        zIndex.value = 0;
      }
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: isDragging.value ? 10 : 2,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  if (!isDragEnabled) {
    return <SimpleSwipeableTaskCard task={task} index={index} />;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SimpleSwipeableTaskCard task={task} index={index} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});