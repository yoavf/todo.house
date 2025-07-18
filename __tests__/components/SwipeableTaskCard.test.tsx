import React from 'react';
import { render } from '@testing-library/react-native';
import { SwipeableTaskCard } from '../../components/SwipeableTaskCard';
import { useTaskStore } from '../../store/taskStore';
import { Task } from '../../types/Task';

jest.mock('../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));
jest.mock('react-native-swipeable-item', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
// Bottom sheet mock is in jest-setup.js

describe('SwipeableTaskCard', () => {
  const mockToggle = jest.fn();
  const mockRemove = jest.fn();
  const mockSnooze = jest.fn();

  const mockTask: Task = {
    id: 'test-1',
    title: 'Test Task',
    completed: false,
    location: 'Kitchen',
    createdAt: new Date('2024-01-01'),
    order: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useTaskStore to handle both direct usage and selector usage
    (useTaskStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        toggle: mockToggle,
        remove: mockRemove,
        snooze: mockSnooze,
        tasks: [],
      };
      
      if (selector) {
        return selector(state);
      }
      
      return state;
    });
  });

  it('renders task card within swipeable container', () => {
    const { getByText } = render(<SwipeableTaskCard task={mockTask} />);
    
    expect(getByText('Test Task')).toBeTruthy();
    expect(getByText('in Kitchen')).toBeTruthy();
  });

  it('renders with drag handle when drag prop is provided', () => {
    const mockDrag = jest.fn();
    const { getByTestId } = render(
      <SwipeableTaskCard task={mockTask} drag={mockDrag} />
    );
    
    // Should render drag handle
    expect(getByTestId('drag-handle')).toBeTruthy();
  });

  it('applies opacity when active', () => {
    const { getByTestId } = render(
      <SwipeableTaskCard task={mockTask} isActive={true} />
    );
    
    const container = getByTestId('swipeable-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.8 })
      ])
    );
  });

  it('does not apply opacity when not active', () => {
    const { getByTestId } = render(
      <SwipeableTaskCard task={mockTask} isActive={false} />
    );
    
    const container = getByTestId('swipeable-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 1 })
      ])
    );
  });
});