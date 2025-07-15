import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, TaskList } from '../components';
import { useTaskStore } from '../store/taskStore';
import { addDemoTasks } from '../utils/demoData';
import { logEnvironmentInfo, testAIIntegration, testEnvironment } from '../utils/testAI';

export default function HomeScreen() {
  const getActiveTasks = useTaskStore((state) => state.getActiveTasks);
  const tasks = useTaskStore((state) => state.tasks);

  const sortedTasks = getActiveTasks();

  const pendingCount = sortedTasks.filter(task => !task.completed).length;

  const handleTestAI = async () => {
    console.log('🧪 User requested AI test');
    await testAIIntegration();
  };

  const handleTestEnv = () => {
    console.log('🧪 User requested environment test');
    logEnvironmentInfo();
    testEnvironment();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>todo.house</Text>
        <View style={styles.headerButtons}>
          {/* Debug buttons */}
          <TouchableOpacity onPress={handleTestEnv} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>Test Env</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTestAI} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>Test AI</Text>
          </TouchableOpacity>

          {/* Demo data button */}
          {tasks.length === 0 && (
            <TouchableOpacity onPress={addDemoTasks} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>Add Demo Data</Text>
            </TouchableOpacity>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
