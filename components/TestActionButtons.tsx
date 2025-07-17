import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';

interface TestActionButtonsProps {
  task: Task;
}

// Simple test component to verify store methods work without swipe complexity
export const TestActionButtons: React.FC<TestActionButtonsProps> = ({ task }) => {
  const remove = useTaskStore((state) => state.remove);
  const toggle = useTaskStore((state) => state.toggle);
  const unsnoozeTask = useTaskStore((state) => state.unsnoozeTask);

  const handleRemove = () => {
    console.log('TestActionButtons: Remove pressed for task:', task.id);
    remove(task.id);
  };

  const handleToggle = () => {
    console.log('TestActionButtons: Toggle pressed for task:', task.id);
    toggle(task.id);
  };

  const handleUnsnooze = () => {
    console.log('TestActionButtons: Unsnooze pressed for task:', task.id);
    unsnoozeTask(task.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>
            {task.completed ? 'Undo' : 'Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRemove}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleUnsnooze}>
          <Text style={styles.buttonText}>Unsnooze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  taskTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
});