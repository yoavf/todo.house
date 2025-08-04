/**
 * Haptic feedback utilities for mobile web applications
 * Provides native-like tactile feedback for user interactions
 */

export type HapticType = 'light' | 'medium' | 'heavy';

interface HapticPattern {
  vibrate: number[];
  delay?: number;
}

const HAPTIC_PATTERNS: Record<HapticType, HapticPattern> = {
  light: { vibrate: [50] },
  medium: { vibrate: [100] },
  heavy: { vibrate: [200] }
};

/**
 * Triggers haptic feedback if the device supports vibration
 * @param type - The intensity of haptic feedback
 * @returns Promise that resolves when feedback is complete
 */
export const triggerHaptic = async (type: HapticType = 'light'): Promise<void> => {
  // Check if the device supports vibration
  if (!('vibrate' in navigator)) {
    return Promise.resolve();
  }

  const pattern = HAPTIC_PATTERNS[type];
  
  try {
    // Trigger the vibration pattern
    navigator.vibrate(pattern.vibrate);
    
    // Return a promise that resolves after the vibration
    const duration = pattern.vibrate.reduce((sum, time) => sum + time, 0);
    return new Promise(resolve => {
      setTimeout(resolve, duration + (pattern.delay || 0));
    });
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return Promise.resolve();
  }
};

/**
 * Enhanced haptic feedback for specific UI interactions
 */
export const hapticFeedback = {
  // Button press feedback
  buttonPress: () => triggerHaptic('light'),
  
  // Successful action feedback
  success: () => triggerHaptic('medium'),
  
  // Error or warning feedback
  error: () => triggerHaptic('heavy'),
  
  // Selection change feedback
  selection: () => triggerHaptic('light'),
  
  // Swipe gesture feedback
  swipe: () => triggerHaptic('light'),
  
  // Long press feedback
  longPress: () => triggerHaptic('medium'),
  
  // Task completion feedback
  taskComplete: async () => {
    await triggerHaptic('medium');
    // Double pulse for completion
    setTimeout(() => triggerHaptic('light'), 150);
  }
};

/**
 * Check if the device supports haptic feedback
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Apply haptic feedback to DOM elements
 * @param element - The DOM element to add haptic feedback to
 * @param type - The type of haptic feedback
 * @param event - The event type to listen for (default: 'click')
 */
export const addHapticToElement = (
  element: HTMLElement,
  type: HapticType = 'light',
  event: string = 'click'
): void => {
  element.addEventListener(event, () => {
    triggerHaptic(type);
  });
};