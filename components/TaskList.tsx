import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Task } from '../types/Task';
import { useTaskStore } from '../store/taskStore';
import { DraggableTaskItem } from './DraggableTaskItem';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const { reorderTasks } = useTaskStore();

  const handleDragEnd = useCallback(({ data }: { data: Task[] }) => {
    reorderTasks(data);
  }, [reorderTasks]);

  const renderItem = useCallback(({ item, index, drag, isActive }: RenderItemParams<Task>) => {
    return (
      <DraggableTaskItem
        task={item}
        index={index}
        drag={drag}
        isActive={isActive}
      />
    );
  }, []);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button to add your first task</Text>
      </View>
    );
  }

  return (
    <DraggableFlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={handleDragEnd}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      getItemLayout={(data, index) => ({
        length: 80, // Approximate task card height
        offset: 80 * index,
        index,
      })}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
    />
  );
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
});