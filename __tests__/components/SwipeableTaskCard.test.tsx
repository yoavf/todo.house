import { render } from '@testing-library/react-native'
import type React from 'react'
import { SwipeableTaskCard } from '../../components/SwipeableTaskCard'
import { useTaskStore } from '../../store/taskStore'
import type { Task } from '../../types/Task'

jest.mock('../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}))
jest.mock('react-native-swipeable-item', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))
// Bottom sheet mock is in jest-setup.js

describe('SwipeableTaskCard', () => {
  const mockToggle = jest.fn()
  const mockRemove = jest.fn()
  const mockSnooze = jest.fn()

  const mockTask: Task = {
    id: 'test-1',
    title: 'Test Task',
    completed: false,
    location: 'Kitchen',
    createdAt: new Date('2024-01-01'),
    order: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useTaskStore to handle both direct usage and selector usage
    ;(useTaskStore as unknown as jest.Mock).mockImplementation(
      (selector?: any) => {
        const state = {
          toggle: mockToggle,
          remove: mockRemove,
          snooze: mockSnooze,
          tasks: [],
        }

        if (selector) {
          return selector(state)
        }

        return state
      },
    )
  })

  it('renders task card within swipeable container', () => {
    const { getByText } = render(<SwipeableTaskCard task={mockTask} />)

    expect(getByText('Test Task')).toBeTruthy()
    expect(getByText('in Kitchen')).toBeTruthy()
  })

  it('renders task within touchable container', () => {
    const mockOnPress = jest.fn()
    const { getByTestId } = render(
      <SwipeableTaskCard task={mockTask} onPress={mockOnPress} />,
    )

    // Should render within swipeable container
    expect(getByTestId('swipeable-container')).toBeTruthy()
  })

  it('renders completed task', () => {
    const completedTask = { ...mockTask, completed: true }
    const { getByText } = render(<SwipeableTaskCard task={completedTask} />)

    expect(getByText('Test Task')).toBeTruthy()
  })
})
