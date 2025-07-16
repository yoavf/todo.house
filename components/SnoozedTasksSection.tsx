import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/taskStore';
import { TaskCard } from './TaskCard';

interface SnoozedTasksSectionProps {
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const SnoozedTasksSection: React.FC<SnoozedTasksSectionProps> = ({
  isExpanded = false,
  onToggleExpanded,
}) => {
  const { getSnoozedTasks, unsnoozeTask } = useTaskStore();
  const snoozedTasks = getSnoozedTasks();

  const formatTimeRemaining = (snoozeUntil: Date): string => {
    const now = new Date();
    const diff = snoozeUntil.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready to unsnooze';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
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
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={onToggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons 
            name="time" 
            size={20} 
            color="#6c757d" 
            style={styles.headerIcon} 
          />
          <Text style={styles.headerTitle}>
            Snoozed ({snoozedTasks.length})
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6c757d" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.tasksContainer}>
          {snoozedTasks.map((task) => (
            <View key={task.id} style={styles.taskContainer}>
              <View style={styles.taskCard}>
                <TaskCard task={task} />
              </View>
              
              <View style={styles.snoozeInfo}>
                <Text style={styles.timeRemaining}>
                  {task.snoozeUntil ? formatTimeRemaining(task.snoozeUntil) : ''}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  tasksContainer: {
    gap: 12,
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