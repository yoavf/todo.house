import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Task } from '../types/Task';
import { SwipeableTaskCard } from './SwipeableTaskCard';

interface DraggableTaskItemProps {
  task: Task;
  index: number;
  drag: () => void;
  isActive: boolean;
}

export const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({ 
  task, 
  index, 
  drag, 
  isActive 
}) => {
  return (
    <ScaleDecorator>
      <SwipeableTaskCard 
        task={task} 
        index={index} 
        drag={drag}
        isActive={isActive}
      />
    </ScaleDecorator>
  );
};