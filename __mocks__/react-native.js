const React = require('react');
const RN = jest.requireActual('react-native');

// Mock components that need special handling
const MockedTouchableOpacity = (props) => {
  return React.createElement('TouchableOpacity', props, props.children);
};

const MockedModal = (props) => {
  if (!props.visible) return null;
  return React.createElement('Modal', props, props.children);
};

const MockedView = (props) => {
  return React.createElement('View', props, props.children);
};

const MockedText = (props) => {
  return React.createElement('Text', props, props.children);
};

const MockedTextInput = (props) => {
  return React.createElement('TextInput', props);
};

const MockedImage = (props) => {
  return React.createElement('Image', props);
};

const MockedFlatList = (props) => {
  return React.createElement('FlatList', props);
};

// Override specific components
module.exports = {
  ...RN,
  TouchableOpacity: MockedTouchableOpacity,
  Modal: MockedModal,
  View: MockedView,
  Text: MockedText,
  TextInput: MockedTextInput,
  Image: MockedImage,
  FlatList: MockedFlatList,
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Alert: {
    alert: jest.fn(),
  },
};