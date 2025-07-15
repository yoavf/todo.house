import { useCallback, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface DragGestureConfig {
  onDragStart?: (index: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  onDragCancel?: () => void;
  longPressDelay?: number;
  itemHeight?: number;
}

export interface DragGestureReturn {
  translateY: Readonly<import('react-native-reanimated').SharedValue<number>>;
  scale: Readonly<import('react-native-reanimated').SharedValue<number>>;
  zIndex: Readonly<import('react-native-reanimated').SharedValue<number>>;
  isDragging: Readonly<import('react-native-reanimated').SharedValue<boolean>>;
  panGesture: ReturnType<typeof Gesture.Pan>;
}

export const useDragGesture = (
  index: number,
  config: DragGestureConfig = {}
): DragGestureReturn => {
  const {
    onDragStart,
    onDragEnd,
    onDragCancel,
    longPressDelay = 500,
    itemHeight = 80,
  } = config;

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragStartIndex = useSharedValue(index);
  
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDrag = useCallback(() => {
    isDragging.value = true;
    scale.value = withSpring(1.05, { damping: 15 });
    zIndex.value = 1000;
    
    // Haptic feedback on drag start
    if (onDragStart) {
      onDragStart(index);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [index, onDragStart, isDragging, scale, zIndex]);

  const endDrag = useCallback((cancelled: boolean = false) => {
    isDragging.value = false;
    scale.value = withSpring(1, { damping: 15 });
    zIndex.value = 0;
    
    if (cancelled) {
      translateY.value = withSpring(0, { damping: 20 });
      if (onDragCancel) {
        onDragCancel();
      }
    } else {
      const currentIndex = dragStartIndex.value;
      const displacement = translateY.value;
      const newIndex = Math.max(0, Math.round(currentIndex + displacement / itemHeight));
      
      translateY.value = withSpring(0, { damping: 20 });
      
      if (onDragEnd && newIndex !== currentIndex) {
        onDragEnd(currentIndex, newIndex);
      }
      
      // Haptic feedback on successful drop
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [translateY, onDragEnd, onDragCancel, isDragging, scale, zIndex, itemHeight, dragStartIndex]);

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      dragStartIndex.value = index;
      
      // Start long press timer
      runOnJS(() => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
        }
        
        longPressTimeout.current = setTimeout(() => {
          startDrag();
        }, longPressDelay);
      })();
    })
    .onUpdate((event) => {
      if (isDragging.value) {
        translateY.value = event.translationY;
      } else {
        // Check if we've moved too much before long press completed
        const distance = Math.abs(event.translationY) + Math.abs(event.translationX);
        if (distance > 10) {
          runOnJS(() => {
            if (longPressTimeout.current) {
              clearTimeout(longPressTimeout.current);
              longPressTimeout.current = null;
            }
          })();
        }
      }
    })
    .onEnd(() => {
      runOnJS(() => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
      })();
      
      if (isDragging.value) {
        runOnJS(endDrag)();
      }
    })
    .onFinalize(() => {
      runOnJS(() => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
      })();
      
      if (isDragging.value) {
        runOnJS(() => endDrag(true))();
      }
    });

  return {
    translateY,
    scale,
    zIndex,
    isDragging,
    panGesture,
  };
};