import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, TaskList } from '../../components';
import { useTaskStore } from '../../store/taskStore';

export default function ActiveTasksScreen() {
  const getActiveTasks = useTaskStore((state) => state.getActiveTasks);
  const sortedTasks = getActiveTasks();

  const pendingCount = sortedTasks.filter(task => !task.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Tasks</Text>
      </View>

      <View style={styles.content}>
        {/* Tasks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tasks</Text>
          <Text style={styles.pendingCount}>{pendingCount} pending</Text>
        </View>

        {/* Task List */}
        <TaskList tasks={sortedTasks} />
      </View>

      {/* Floating Action Button */}
      <FAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
  pendingCount: {
    fontSize: 16,
    color: '#6c757d',
  },
});
