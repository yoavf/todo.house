import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from '../TaskItem'
import { Task } from '@/lib/api'

describe('TaskItem', () => {
  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'test-user'
  }

  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task title and description', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('shows strikethrough when task is completed', () => {
    const completedTask = { ...mockTask, completed: true }
    render(
      <TaskItem
        task={completedTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const title = screen.getByText('Test Task')
    expect(title).toHaveClass('line-through')
  })

  it('calls onUpdate when checkbox is toggled', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockOnUpdate).toHaveBeenCalledWith(1, { completed: true })
  })

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('enters edit mode when edit button is clicked', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Task description')).toBeInTheDocument()
  })

  it('updates task when save is clicked in edit mode', async () => {
    const user = userEvent.setup()
    
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    const titleInput = screen.getByPlaceholderText('Task title')
    const descriptionInput = screen.getByPlaceholderText('Task description')

    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Updated Description')

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    expect(mockOnUpdate).toHaveBeenCalledWith(1, {
      title: 'Updated Task',
      description: 'Updated Description'
    })
  })

  it('cancels edit mode without saving changes', async () => {
    const user = userEvent.setup()
    
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    const titleInput = screen.getByPlaceholderText('Task title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Should not be saved')

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })
})