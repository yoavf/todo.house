import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSwipeGesture, SwipeAction } from '../hooks';
import { useTaskStore } from '../store/taskStore';
import { Task, SnoozeDuration } from '../types/Task';
import { TaskCard } from './TaskCard';
import { SnoozeActionSheet } from './SnoozeActionSheet';

interface SwipeableTaskCardProps {
  task: Task;
  index: number;
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({ task, index }) => {
  const { remove, toggle } = useTaskStore();
  const snoozeSheetRef = useRef<BottomSheetModal>(null);

  const handleDelete = useCallback(() => {
    remove(task.id);
  }, [remove, task.id]);

  const handleSnooze = useCallback(() => {
    snoozeSheetRef.current?.present();
  }, []);

  const handleToggle = useCallback(() => {
    toggle(task.id);
  }, [toggle, task.id]);

  // Define swipe actions
  const leftActions: SwipeAction[] = [
    {
      id: 'complete',
      label: task.completed ? 'Undo' : 'Complete',
      color: task.completed ? '#6c757d' : '#28a745',
      icon: task.completed ? 'arrow-undo' : 'checkmark',
      onPress: handleToggle,
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'snooze',
      label: 'Snooze',
      color: '#ffc107',
      icon: 'time',
      onPress: handleSnooze,
    },
    {
      id: 'delete',
      label: 'Delete',
      color: '#dc3545',
      icon: 'trash',
      onPress: handleDelete,
    },
  ];

  const {
    translateX,
    leftActionsWidth,
    rightActionsWidth,
    closeSwipe,
    panGesture,
  } = useSwipeGesture({
    leftActions,
    rightActions,
    enabled: true,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionsStyle = useAnimatedStyle(() => ({
    width: leftActionsWidth.value,
  }));

  const rightActionsStyle = useAnimatedStyle(() => ({
    width: rightActionsWidth.value,
  }));

  const renderActions = (actions: SwipeAction[], isLeft: boolean) => {
    return actions.map((action, actionIndex) => (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionButton,
          { backgroundColor: action.color },
          isLeft && actionIndex === 0 && styles.firstLeftAction,
          !isLeft && actionIndex === actions.length - 1 && styles.lastRightAction,
        ]}
        onPress={() => {
          action.onPress();
          closeSwipe();
        }}
      >
        <Ionicons name={action.icon as any} size={20} color="white" />
        <Text style={styles.actionText}>{action.label}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      <Animated.View style={[styles.leftActions, leftActionsStyle]}>
        {renderActions(leftActions, true)}
      </Animated.View>

      {/* Right Actions */}
      <Animated.View style={[styles.rightActions, rightActionsStyle]}>
        {renderActions(rightActions, false)}
      </Animated.View>

      {/* Main Task Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
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
  leftActions: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: 80,
  },
  firstLeftAction: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  lastRightAction: {
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