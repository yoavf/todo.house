import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDragDrop } from './DragDropContext';

interface DropZoneProps {
  index: number;
}

export const DropZone: React.FC<DropZoneProps> = ({ index }) => {
  const { isDragging, dropTargetIndex, draggedIndex } = useDragDrop();

  const animatedStyle = useAnimatedStyle(() => {
    const isTargetZone = dropTargetIndex.value === index && 
                         isDragging.value && 
                         draggedIndex.value !== index;
    
    return {
      height: isTargetZone ? 40 : 4,
      opacity: isTargetZone ? 1 : 0,
      backgroundColor: isTargetZone ? '#E5E5E7' : 'transparent',
    };
  });

  return <Animated.View style={[styles.dropZone, animatedStyle]} />;
};

const styles = StyleSheet.create({
  dropZone: {
    marginVertical: 2,
    borderRadius: 20,
    marginHorizontal: 16,
  },
});