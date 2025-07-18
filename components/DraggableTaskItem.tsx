import type React from 'react'
import { ScaleDecorator } from 'react-native-draggable-flatlist'
import type { Task } from '../types/Task'
import { SwipeableTaskCard } from './SwipeableTaskCard'

interface DraggableTaskItemProps {
  task: Task
  drag: () => void
  isActive: boolean
}

export const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({
  task,
  drag,
  isActive,
}) => {
  return (
    <ScaleDecorator>
      <SwipeableTaskCard task={task} drag={drag} isActive={isActive} />
    </ScaleDecorator>
  )
}
