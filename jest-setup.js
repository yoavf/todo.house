// Global setup
global.__DEV__ = true;

// Set NODE_ENV to test to ensure logger is disabled
process.env.NODE_ENV = 'test';

// Mock logger to ensure complete silence during tests
jest.mock('./utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    setEnabled: jest.fn(),
    setLevel: jest.fn(),
  }
}));

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
  const { View, TextInput } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(({ children }, ref) => {
      return <View testID="bottom-sheet-modal">{children}</View>;
    }),
    BottomSheetView: ({ children }) => <View>{children}</View>,
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetTextInput: TextInput,
  };
});

// Mock LayoutAnimation
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Presets: {
    easeInEaseOut: {},
  },
}));

// Mock all the Expo winter runtime globals
global.__ExpoImportMetaRegistry = {};
global.__expo_import_default = (module) => module?.default || module;
global.__expo_import_star = (module) => module;

// Mock defineLazyObjectProperty which is causing the issue
const mockDefineLazyObjectProperty = {
  getValue: () => ({})
};

// Override the problematic React Native utility
jest.mock('react-native/Libraries/Utilities/defineLazyObjectProperty', () => ({
  __esModule: true,
  default: mockDefineLazyObjectProperty,
  getValue: () => ({})
}));

// Mock the entire winter runtime module at the Jest level
jest.mock('expo/src/winter/runtime.native', () => ({
  __ExpoImportMetaRegistry: {}
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  
  return {
    Provider: ({ children }) => children,
    Portal: ({ children }) => children,
    FAB: {
      Group: ({ open, visible, icon, label, actions, onStateChange, testID, style, fabStyle, ...props }) => {
        return (
          <View testID={testID} style={style}>
            <TouchableOpacity 
              onPress={() => onStateChange({ open: !open })}
              style={fabStyle}
            >
              <Text>{icon}</Text>
              {label && <Text>{label}</Text>}
            </TouchableOpacity>
            {open && actions && actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                testID={action.testID}
                onPress={action.onPress}
                style={action.style}
              >
                <Text>{action.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      },
    },
    useTheme: () => ({
      colors: {
        primary: '#3b82f6',
        accent: '#10b981',
      },
    }),
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');