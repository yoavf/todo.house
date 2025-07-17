import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from '../../components/TaskCard';
import { getRandomWheneverLabel } from '../../utils/dateUtils';
import { MILLISECONDS_PER_HOUR, MILLISECONDS_PER_MINUTE } from '../../utils/constants';

export default function SnoozedScreen() {
  const getSnoozedTasks = useTaskStore((state) => state.getSnoozedTasks);
  const unsnoozeTask = useTaskStore((state) => state.unsnoozeTask);
  const snoozedTasks = getSnoozedTasks();

  const formatTimeRemaining = (snoozeUntil?: Date): string => {
    if (!snoozeUntil) return getRandomWheneverLabel();
    
    const now = new Date();
    const diff = snoozeUntil.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready to unsnooze';
    
    const hours = Math.floor(diff / MILLISECONDS_PER_HOUR);
    const minutes = Math.floor((diff % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const handleUnsnooze = (taskId: string) => {
    unsnoozeTask(taskId);
  };

  if (snoozedTasks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Snoozed Tasks</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="time" size={64} color="#adb5bd" />
          <Text style={styles.emptyTitle}>No Snoozed Tasks</Text>
          <Text style={styles.emptyDescription}>
            Tasks you snooze will appear here until their snooze time expires.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Snoozed Tasks</Text>
        <Text style={styles.count}>{snoozedTasks.length} task{snoozedTasks.length === 1 ? '' : 's'}</Text>
      </View>

      <View style={styles.content}>
        {snoozedTasks.map((task) => (
          <View key={task.id} style={styles.taskContainer}>
            <View style={styles.taskCard}>
              <TaskCard task={task} />
            </View>
            
            <View style={styles.snoozeInfo}>
              <Text style={styles.timeRemaining}>
                {formatTimeRemaining(task.snoozeUntil)}
              </Text>
              <TouchableOpacity
                style={styles.unsnoozeButton}
                onPress={() => handleUnsnooze(task.id)}
              >
                <Ionicons name="alarm-outline" size={16} color="#007bff" />
                <Text style={styles.unsnoozeText}>Unsnooze</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  count: {
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  taskContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  taskCard: {
    opacity: 0.7,
  },
  snoozeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  unsnoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  unsnoozeText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    marginLeft: 4,
  },
});