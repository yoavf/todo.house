import { fireEvent, render, screen } from "@testing-library/react";
import { FAB } from "../FAB";

describe("FAB", () => {
	let mockOnCameraClick: jest.Mock;

	beforeEach(() => {
		mockOnCameraClick = jest.fn();
		jest.clearAllMocks();
	});

	it("renders the main FAB button", () => {
		render(<FAB />);

		// The main button should have a plus icon
		const mainButton = screen.getByRole("button");
		expect(mainButton).toBeInTheDocument();
		expect(mainButton).toHaveClass("bg-orange-500");
	});

	it("toggles menu when clicked", () => {
		render(<FAB />);

		const mainButton = screen.getByRole("button");

		// Initially, menu items should not be visible
		expect(screen.queryAllByRole("button")).toHaveLength(1);

		// Click to open menu
		fireEvent.click(mainButton);

		// Should show 4 buttons total (main + 3 menu items)
		expect(screen.getAllByRole("button")).toHaveLength(4);

		// Main button should rotate when open
		expect(mainButton).toHaveClass("rotate-45");

		// Click again to close
		fireEvent.click(mainButton);

		// Should only show main button
		expect(screen.queryAllByRole("button")).toHaveLength(1);
		expect(mainButton).not.toHaveClass("rotate-45");
	});

	it("opens camera when camera button is clicked", () => {
		render(<FAB onCameraClick={mockOnCameraClick} />);

		// Open the menu
		const mainButton = screen.getByRole("button");
		fireEvent.click(mainButton);

		// Find and click the camera button by test ID
		const cameraButton = screen.getByTestId("fab-camera");
		fireEvent.click(cameraButton);

		// Verify callback was called
		expect(mockOnCameraClick).toHaveBeenCalledTimes(1);

		// Menu should be closed
		expect(screen.getAllByRole("button")).toHaveLength(1);
	});

	it("handles keyboard and microphone buttons", () => {
		const localMockOnKeyboardClick = jest.fn();
		const localMockOnMicrophoneClick = jest.fn();

		render(
			<FAB
				onKeyboardClick={localMockOnKeyboardClick}
				onMicrophoneClick={localMockOnMicrophoneClick}
			/>,
		);

		// Open menu
		const mainButton = screen.getByRole("button");
		fireEvent.click(mainButton);

		// Click keyboard button by test ID
		const keyboardButton = screen.getByTestId("fab-keyboard");
		fireEvent.click(keyboardButton);
		expect(localMockOnKeyboardClick).toHaveBeenCalledTimes(1);

		// Menu should close after clicking a button
		expect(screen.getAllByRole("button")).toHaveLength(1);

		// Open menu again
		fireEvent.click(mainButton);

		// Click microphone button by test ID
		const microphoneButton = screen.getByTestId("fab-microphone");
		fireEvent.click(microphoneButton);
		expect(localMockOnMicrophoneClick).toHaveBeenCalledTimes(1);

		// Menu should close after clicking a button
		expect(screen.getAllByRole("button")).toHaveLength(1);
	});
});
