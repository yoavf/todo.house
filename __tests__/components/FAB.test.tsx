import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FAB } from '../../components/FAB';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('FAB', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = render(<FAB />);
    
    const touchable = getByTestId('fab-button');
    expect(touchable).toBeTruthy();
  });

  it('navigates to camera screen when pressed', () => {
    const { getByTestId } = render(<FAB />);
    
    const touchable = getByTestId('fab-button');
    fireEvent.press(touchable);
    
    expect(mockPush).toHaveBeenCalledWith('/camera');
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('has correct styles applied', () => {
    const { getByTestId } = render(<FAB />);
    
    const touchable = getByTestId('fab-button');
    const styles = touchable.props.style;
    
    expect(styles).toEqual(expect.objectContaining({
      position: 'absolute',
      bottom: 30,
      right: 30,
      borderRadius: 30,
    }));
  });

  it('has correct active opacity', () => {
    const { getByTestId } = render(<FAB />);
    
    const touchable = getByTestId('fab-button');
    expect(touchable.props.activeOpacity).toBe(0.8);
  });
});