import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { useRouter, useSegments } from 'expo-router'
import { FAB } from '../../components/FAB'
import { useTaskStore } from '../../store/taskStore'

// Mock modules
jest.mock('../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}))

jest.mock('../../components/LocationPicker', () => ({
  LocationPicker: 'LocationPicker',
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
}))

jest.mock('react-native-paper', () => ({
  Portal: ({ children }: any) => children,
  FAB: {
    Group: jest.fn(
      ({ visible, open, onStateChange, actions, onPress, testID }) => {
        const MockFABGroup = require('react-native').View
        return (
          <MockFABGroup testID={testID || 'fab-group'}>
            {visible !== false && (
              <MockFABGroup
                testID="fab-button"
                onTouchEnd={() => {
                  if (!open && onPress) onPress()
                  if (onStateChange) onStateChange({ open: !open })
                }}
              />
            )}
            {open &&
              actions?.map((action: any, index: number) => (
                <MockFABGroup
                  key={index}
                  testID={`fab-action-${action.icon}`}
                  onTouchEnd={() => action.onPress()}
                />
              ))}
          </MockFABGroup>
        )
      },
    ),
  },
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  return {
    BottomSheetModal: React.forwardRef(
      ({ children, onChange, onDismiss }: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
          present: () => onChange?.(0),
          dismiss: () => {
            onChange?.(-1)
            onDismiss?.()
          },
        }))
        return children
      },
    ),
    BottomSheetView: ({ children }: any) => children,
    BottomSheetTextInput: 'TextInput',
  }
})

describe('FAB', () => {
  const mockPush = jest.fn()
  const mockAdd = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useSegments as jest.Mock).mockReturnValue([])
    ;(useTaskStore as jest.Mock).mockReturnValue({
      add: mockAdd,
    })
  })

  it('renders correctly', () => {
    const { getByTestId } = render(<FAB />)

    const fabGroup = getByTestId('fab-group')
    expect(fabGroup).toBeTruthy()
  })

  it('opens speed dial when pressed', () => {
    const { getByTestId, queryByTestId } = render(<FAB />)

    const fabButton = getByTestId('fab-button')

    // Speed dial actions should not be visible initially
    expect(queryByTestId('fab-action-camera')).toBeNull()
    expect(queryByTestId('fab-action-microphone')).toBeNull()
    expect(queryByTestId('fab-action-pencil')).toBeNull()

    // Press FAB to open speed dial
    fireEvent(fabButton, 'onTouchEnd')

    // Speed dial actions should now be visible
    expect(queryByTestId('fab-action-camera')).toBeTruthy()
    expect(queryByTestId('fab-action-microphone')).toBeTruthy()
    expect(queryByTestId('fab-action-pencil')).toBeTruthy()
  })

  it('navigates to camera screen when camera option is pressed', () => {
    const { getByTestId } = render(<FAB />)

    // Open speed dial first
    const fabButton = getByTestId('fab-button')
    fireEvent(fabButton, 'onTouchEnd')

    // Press camera action
    const cameraAction = getByTestId('fab-action-camera')
    fireEvent(cameraAction, 'onTouchEnd')

    expect(mockPush).toHaveBeenCalledWith('/camera')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('opens bottom sheet when type option is pressed', () => {
    const { getByTestId, getByPlaceholderText } = render(<FAB />)

    // Open speed dial first
    const fabButton = getByTestId('fab-button')
    fireEvent(fabButton, 'onTouchEnd')

    // Press type action
    const typeAction = getByTestId('fab-action-pencil')
    fireEvent(typeAction, 'onTouchEnd')

    // Check if bottom sheet content is rendered
    expect(getByPlaceholderText('What needs to be done?')).toBeTruthy()
  })

  it('hides FAB when camera is open', () => {
    ;(useSegments as jest.Mock).mockReturnValue(['camera'])

    const { queryByTestId } = render(<FAB />)

    // FAB should not be visible when camera is open
    expect(queryByTestId('fab-button')).toBeNull()
  })

  it('creates task when form is submitted', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<FAB />)

    // Open speed dial and type option
    const fabButton = getByTestId('fab-button')
    fireEvent(fabButton, 'onTouchEnd')

    const typeAction = getByTestId('fab-action-pencil')
    fireEvent(typeAction, 'onTouchEnd')

    // Fill in task title
    const titleInput = getByPlaceholderText('What needs to be done?')
    fireEvent.changeText(titleInput, 'Test task')

    // Submit form
    const createButton = getByText('Create Task')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith({
        title: 'Test task',
        location: undefined,
        completed: false,
      })
    })
  })

  it('does not create task with empty title', () => {
    const { getByTestId, getByText } = render(<FAB />)

    // Open speed dial and type option
    const fabButton = getByTestId('fab-button')
    fireEvent(fabButton, 'onTouchEnd')

    const typeAction = getByTestId('fab-action-pencil')
    fireEvent(typeAction, 'onTouchEnd')

    // Try to submit with empty title
    const createButton = getByText('Create Task')
    fireEvent.press(createButton)

    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('navigates to voice screen when voice option is pressed', () => {
    const { getByTestId } = render(<FAB />)

    // Open speed dial first
    const fabButton = getByTestId('fab-button')
    fireEvent(fabButton, 'onTouchEnd')

    // Press voice action
    const voiceAction = getByTestId('fab-action-microphone')
    fireEvent(voiceAction, 'onTouchEnd')

    expect(mockPush).toHaveBeenCalledWith('/voice')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })
})
