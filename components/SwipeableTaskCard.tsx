import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { TaskCard } from './TaskCard';
import { SnoozeActionSheet } from './SnoozeActionSheet';

interface SwipeableTaskCardProps {
  task: Task;
  index: number;
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({ task, index }) => {
  const { remove, toggle } = useTaskStore();
  const snoozeSheetRef = useRef<BottomSheetModal>(null);
  
  const translateX = useSharedValue(0);
  const isRevealed = useSharedValue(false);

  const handleComplete = useCallback(() => {
    toggle(task.id);
    translateX.value = withSpring(0);
    isRevealed.value = false;
  }, [toggle, task.id, translateX, isRevealed]);

  const handleSnooze = useCallback(() => {
    snoozeSheetRef.current?.present();
    translateX.value = withSpring(0);
    isRevealed.value = false;
  }, [translateX, isRevealed]);

  const handleDelete = useCallback(() => {
    remove(task.id);
  }, [remove, task.id]);

  const closeActions = useCallback(() => {
    translateX.value = withSpring(0);
    isRevealed.value = false;
  }, [translateX, isRevealed]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const translation = event.translationX;
      
      if (translation > 0) {
        // Swipe right - show complete action
        translateX.value = Math.min(translation, 100);
      } else {
        // Swipe left - show snooze/delete actions
        translateX.value = Math.max(translation, -160);
      }
    })
    .onEnd((event) => {
      const translation = event.translationX;
      const velocity = event.velocityX;
      
      if (Math.abs(translation) > 60 || Math.abs(velocity) > 1000) {
        if (translation > 0) {
          // Swipe right - complete
          translateX.value = withSpring(100);
          isRevealed.value = true;
        } else {
          // Swipe left - show actions
          translateX.value = withSpring(-160);
          isRevealed.value = true;
        }
      } else {
        // Snap back
        runOnJS(closeActions)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      {/* Left Action (Complete) */}
      <Animated.View style={[styles.leftAction, leftActionStyle]}>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Ionicons 
            name={task.completed ? 'arrow-undo' : 'checkmark'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.actionText}>
            {task.completed ? 'Undo' : 'Complete'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Right Actions (Snooze, Delete) */}
      <Animated.View style={[styles.rightActions, rightActionStyle]}>
        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <Ionicons name="time" size={20} color="white" />
          <Text style={styles.actionText}>Snooze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Task Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.taskCard, animatedStyle]}>
          <TaskCard task={task} />
        </Animated.View>
      </GestureDetector>

      {/* Snooze Action Sheet */}
      <SnoozeActionSheet
        bottomSheetRef={snoozeSheetRef}
        taskId={task.id}
        onClose={() => snoozeSheetRef.current?.dismiss()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 1,
  },
  leftAction: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 160,
    flexDirection: 'row',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  completeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#28a745',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  snoozeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});