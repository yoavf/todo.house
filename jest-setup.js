// Global setup
global.__DEV__ = true;

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
}));

// Mock expo icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: jest.fn(() => ({
        onStart: jest.fn(() => ({ onUpdate: jest.fn(() => ({ onEnd: jest.fn() })) })),
      })),
      LongPress: jest.fn(() => ({
        onStart: jest.fn(),
      })),
      Simultaneous: jest.fn(),
    },
    Directions: {},
  };
});

// Mock bottom sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(({ children }, ref) => {
      return <View testID="bottom-sheet-modal">{children}</View>;
    }),
    BottomSheetView: ({ children }) => <View>{children}</View>,
    BottomSheetModalProvider: ({ children }) => children,
  };
});