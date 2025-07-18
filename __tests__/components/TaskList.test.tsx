import { render } from '@testing-library/react-native'
import { TaskList } from '../../components/TaskList'
import type { Task } from '../../types/Task'

// Mock SwipeableTaskCard
jest.mock('../../components/SwipeableTaskCard', () => ({
  SwipeableTaskCard: ({ task }: { task: any }) => {
    const View = require('react-native').View
    const Text = require('react-native').Text
    return (
      <View testID={`task-${task.id}`}>
        <Text>{task.title}</Text>
      </View>
    )
  },
}))

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      completed: false,
      createdAt: new Date('2024-01-01'),
      order: 0,
    },
    {
      id: 'task-2',
      title: 'Task 2',
      completed: true,
      createdAt: new Date('2024-01-02'),
      order: 1,
    },
    {
      id: 'task-3',
      title: 'Task 3',
      completed: false,
      createdAt: new Date('2024-01-03'),
      order: 2,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders list of tasks', () => {
    const { getByText, getByTestId } = render(<TaskList tasks={mockTasks} />)

    expect(getByText('Task 1')).toBeTruthy()
    expect(getByText('Task 2')).toBeTruthy()
    expect(getByText('Task 3')).toBeTruthy()

    expect(getByTestId('task-task-1')).toBeTruthy()
    expect(getByTestId('task-task-2')).toBeTruthy()
    expect(getByTestId('task-task-3')).toBeTruthy()
  })

  it('renders empty state when no tasks', () => {
    const { getByText, getByTestId } = render(<TaskList tasks={[]} />)

    expect(getByText('No tasks yet')).toBeTruthy()
    expect(getByText('Tap the + button to add your first task')).toBeTruthy()
    expect(getByTestId('empty-container')).toBeTruthy()
  })

  it('empty state renders with correct styles', () => {
    const { getByTestId } = render(<TaskList tasks={[]} />)

    const emptyContainer = getByTestId('empty-container')
    expect(emptyContainer.props.style).toEqual(
      expect.objectContaining({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }),
    )
  })
})
