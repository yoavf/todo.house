import { useCallback, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface SwipeAction {
  id: string;
  label: string;
  color: string;
  icon?: string;
  onPress: () => void;
}

export interface SwipeGestureConfig {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeStart?: (direction: 'left' | 'right') => void;
  onSwipeEnd?: () => void;
  onActionTriggered?: (action: SwipeAction) => void;
  revealThreshold?: number;
  actionThreshold?: number;
  enabled?: boolean;
}

export interface SwipeGestureReturn {
  translateX: Readonly<import('react-native-reanimated').SharedValue<number>>;
  isSwipeActive: Readonly<import('react-native-reanimated').SharedValue<boolean>>;
  leftActionsWidth: Readonly<import('react-native-reanimated').SharedValue<number>>;
  rightActionsWidth: Readonly<import('react-native-reanimated').SharedValue<number>>;
  closeSwipe: () => void;
  panGesture: ReturnType<typeof Gesture.Pan>;
}

export const useSwipeGesture = (
  config: SwipeGestureConfig = {}
): SwipeGestureReturn => {
  const {
    leftActions = [],
    rightActions = [],
    onSwipeStart,
    onSwipeEnd,
    onActionTriggered,
    revealThreshold = 0.3,
    actionThreshold = 0.7,
    enabled = true,
  } = config;

  const translateX = useSharedValue(0);
  const isSwipeActive = useSharedValue(false);
  const leftActionsWidth = useSharedValue(80 * leftActions.length);
  const rightActionsWidth = useSharedValue(80 * rightActions.length);
  const swipeDirection = useSharedValue<'left' | 'right' | null>(null);
  const hasTriggeredAction = useSharedValue(false);

  const closeSwipe = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20 });
    isSwipeActive.value = false;
    swipeDirection.value = null;
    
    if (onSwipeEnd) {
      onSwipeEnd();
    }
  }, [translateX, isSwipeActive, swipeDirection, onSwipeEnd]);

  const triggerAction = useCallback((actions: SwipeAction[], direction: 'left' | 'right') => {
    if (actions.length === 0) return;
    
    // For now, trigger the first action
    const action = actions[0];
    
    // Haptic feedback for action trigger
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onActionTriggered) {
      onActionTriggered(action);
    }
    
    action.onPress();
    closeSwipe();
  }, [onActionTriggered, closeSwipe]);

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .enabled(enabled)
    .onStart(() => {
      hasTriggeredAction.value = false;
    })
    .onUpdate((event) => {
      if (!enabled) return;
      
      const translationX = event.translationX;
      const absTranslationX = Math.abs(translationX);
      
      // Determine swipe direction
      if (absTranslationX > 10 && !swipeDirection.value) {
        const direction = translationX > 0 ? 'right' : 'left';
        swipeDirection.value = direction;
        isSwipeActive.value = true;
        
        if (onSwipeStart) {
          runOnJS(onSwipeStart)(direction);
        }
      }
      
      if (swipeDirection.value) {
        const maxWidth = swipeDirection.value === 'left' 
          ? -leftActionsWidth.value 
          : rightActionsWidth.value;
        
        // Apply some resistance when going beyond the actions width
        let constrainedTranslation = translationX;
        if (swipeDirection.value === 'left' && translationX < maxWidth) {
          constrainedTranslation = maxWidth - (maxWidth - translationX) * 0.2;
        } else if (swipeDirection.value === 'right' && translationX > maxWidth) {
          constrainedTranslation = maxWidth + (translationX - maxWidth) * 0.2;
        }
        
        translateX.value = constrainedTranslation;
        
        // Check for action threshold
        const actions = swipeDirection.value === 'left' ? leftActions : rightActions;
        const threshold = Math.abs(maxWidth) * actionThreshold;
        
        if (absTranslationX > threshold && !hasTriggeredAction.value && actions.length > 0) {
          hasTriggeredAction.value = true;
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    })
    .onEnd((event) => {
      if (!enabled || !swipeDirection.value) return;
      
      const translationX = event.translationX;
      const absTranslationX = Math.abs(translationX);
      const velocity = event.velocityX;
      
      const actions = swipeDirection.value === 'left' ? leftActions : rightActions;
      const maxWidth = swipeDirection.value === 'left' 
        ? -leftActionsWidth.value 
        : rightActionsWidth.value;
      
      const revealThresholdDistance = Math.abs(maxWidth) * revealThreshold;
      const actionThresholdDistance = Math.abs(maxWidth) * actionThreshold;
      
      // High velocity swipe - trigger action if available
      if (Math.abs(velocity) > 1000 && actions.length > 0) {
        runOnJS(triggerAction)(actions, swipeDirection.value);
        return;
      }
      
      // Check if we should trigger action based on distance
      if (absTranslationX > actionThresholdDistance && actions.length > 0) {
        runOnJS(triggerAction)(actions, swipeDirection.value);
        return;
      }
      
      // Check if we should reveal actions
      if (absTranslationX > revealThresholdDistance && actions.length > 0) {
        translateX.value = withSpring(maxWidth, { damping: 20 });
        
        // Light haptic feedback for reveal
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      } else {
        runOnJS(closeSwipe)();
      }
    })
    .onFinalize(() => {
      if (!enabled) return;
      runOnJS(closeSwipe)();
    });

  return {
    translateX,
    isSwipeActive,
    leftActionsWidth,
    rightActionsWidth,
    closeSwipe,
    panGesture,
  };
};