import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDragGesture } from '../hooks';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { SwipeableTaskCard } from './SwipeableTaskCard';

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
  const { reorderTasks } = useTaskStore();

  const handleDragStart = useCallback((startIndex: number) => {
    console.log('🎯 Drag started at index:', startIndex);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    console.log('🎯 Drag ended from', fromIndex, 'to', toIndex);
    if (fromIndex !== toIndex) {
      reorderTasks(fromIndex, toIndex);
    }
  }, [reorderTasks]);

  const handleDragCancel = useCallback(() => {
    console.log('🎯 Drag cancelled');
  }, []);

  const {
    translateY,
    scale,
    zIndex,
    isDragging,
    panGesture,
  } = useDragGesture(index, {
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
    longPressDelay: 500,
    itemHeight: 80,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: isDragging.value ? 10 : 0,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: isDragging.value ? 0.9 : 1,
  }));

  if (!isDragEnabled) {
    // If drag is disabled, just render the swipeable card
    return <SwipeableTaskCard task={task} index={index} />;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.draggableCard, animatedStyle]}>
          <SwipeableTaskCard task={task} index={index} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  draggableCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});