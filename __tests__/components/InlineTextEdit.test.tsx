import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { InlineTextEdit } from '../../components/InlineTextEdit'

describe('InlineTextEdit', () => {
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders text when not editing', () => {
    const { getByText } = render(
      <InlineTextEdit value="Test Value" onUpdate={mockOnUpdate} />,
    )

    expect(getByText('Test Value')).toBeTruthy()
  })

  it('shows placeholder when value is empty', () => {
    const { getByText } = render(
      <InlineTextEdit
        value=""
        onUpdate={mockOnUpdate}
        placeholder="Enter text"
      />,
    )

    expect(getByText('Enter text')).toBeTruthy()
  })

  it('enters edit mode when pressed', () => {
    const { getByText, getByDisplayValue } = render(
      <InlineTextEdit value="Test Value" onUpdate={mockOnUpdate} />,
    )

    const text = getByText('Test Value')
    fireEvent.press(text)

    // Should show input with current value
    expect(getByDisplayValue('Test Value')).toBeTruthy()
  })

  it('updates value on blur', async () => {
    const { getByText, getByDisplayValue } = render(
      <InlineTextEdit value="Test Value" onUpdate={mockOnUpdate} />,
    )

    const text = getByText('Test Value')
    fireEvent.press(text)

    const input = getByDisplayValue('Test Value')
    fireEvent.changeText(input, 'New Value')
    fireEvent(input, 'blur')

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('New Value')
    })
  })

  it('updates value on submit', async () => {
    const { getByText, getByDisplayValue } = render(
      <InlineTextEdit value="Test Value" onUpdate={mockOnUpdate} />,
    )

    const text = getByText('Test Value')
    fireEvent.press(text)

    const input = getByDisplayValue('Test Value')
    fireEvent.changeText(input, 'New Value')
    fireEvent(input, 'submitEditing')

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('New Value')
    })
  })

  it('applies custom styles', () => {
    const customStyle = { color: 'red', fontSize: 20 }
    const { getByText } = render(
      <InlineTextEdit
        value="Test Value"
        onUpdate={mockOnUpdate}
        style={customStyle}
      />,
    )

    const text = getByText('Test Value')
    expect(text.props.style).toEqual(customStyle)
  })
})
