import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, TaskList } from '../../components';
import { useTaskStore, getActiveTasks } from '../../store/taskStore';

export default function ActiveTasksScreen() {
  const tasks = useTaskStore((state) => state.tasks);
  
  const sortedTasks = useMemo(() => getActiveTasks(tasks), [tasks]);
  const pendingCount = useMemo(() => sortedTasks.filter(task => !task.completed).length, [sortedTasks]);

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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.5,
  },
  pendingCount: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
