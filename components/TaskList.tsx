import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Task } from '../types/Task';
import { DraggableTaskCard } from './DraggableTaskCard';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button to add your first task</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DraggableTaskCard 
          task={item} 
          index={index} 
          isDragEnabled={true}
        />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      scrollEnabled={true}
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