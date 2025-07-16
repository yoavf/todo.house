import React, { createContext, useContext } from 'react';
import { useSharedValue } from 'react-native-reanimated';

interface DragDropContextValue {
  isDragging: ReturnType<typeof useSharedValue<boolean>>;
  draggedIndex: ReturnType<typeof useSharedValue<number>>;
  dropTargetIndex: ReturnType<typeof useSharedValue<number>>;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export const DragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDragging = useSharedValue(false);
  const draggedIndex = useSharedValue(-1);
  const dropTargetIndex = useSharedValue(-1);

  return (
    <DragDropContext.Provider value={{ isDragging, draggedIndex, dropTargetIndex }}>
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
};