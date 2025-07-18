import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FAB, TaskList } from '../../components';
import { useTaskStore, getActiveTasks } from '../../store/taskStore';

export default function ActiveTasksScreen() {
  const tasks = useTaskStore((state) => state.tasks);
  
  const sortedTasks = useMemo(() => getActiveTasks(tasks), [tasks]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Tasks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tasks</Text>
        </View>

        {/* Task List */}
        <TaskList tasks={sortedTasks} />
      </View>

      {/* Floating Action Button */}
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
