import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskPlaceholderImageProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function TaskPlaceholderImage({ size = 60, style }: TaskPlaceholderImageProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Ionicons name="checkbox-outline" size={size * 0.5} color="#adb5bd" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
});