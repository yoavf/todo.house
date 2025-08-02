import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FAB } from "../FAB";

describe("FAB", () => {
	const mockOnTasksGenerated = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the main FAB button", () => {
		render(<FAB onTasksGenerated={mockOnTasksGenerated} />);

		// The main button should have a plus icon
		const mainButton = screen.getByRole("button");
		expect(mainButton).toBeInTheDocument();
		expect(mainButton).toHaveClass("bg-orange-500");
	});

	it("toggles menu when clicked", () => {
		render(<FAB onTasksGenerated={mockOnTasksGenerated} />);

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

	it("opens camera screen when camera button is clicked", async () => {
		render(<FAB onTasksGenerated={mockOnTasksGenerated} />);

		// Open the menu
		const mainButton = screen.getByRole("button");
		fireEvent.click(mainButton);

		// Find and click the camera button (third menu item, which is at index 2)
		const menuButtons = screen.getAllByRole("button");
		const cameraButton = menuButtons[2]; // Camera is the third button (index 2)
		fireEvent.click(cameraButton);

		// Wait for camera screen to appear
		await waitFor(() => {
			expect(screen.getByText("Capture Home Task")).toBeInTheDocument();
		});

		// Menu should be closed
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument(); // Close button in camera screen
	});

	it("closes camera screen when close button is clicked", async () => {
		render(<FAB onTasksGenerated={mockOnTasksGenerated} />);

		// Open camera screen
		const mainButton = screen.getByRole("button");
		fireEvent.click(mainButton);
		const cameraButton = screen.getAllByRole("button")[2];
		fireEvent.click(cameraButton);

		// Wait for camera screen
		await waitFor(() => {
			expect(screen.getByText("Capture Home Task")).toBeInTheDocument();
		});

		// Find and click close button in camera screen
		const closeButton = screen.getByRole("button", { name: "Close" });
		fireEvent.click(closeButton);

		// Camera screen should be closed
		expect(screen.queryByText("Capture Home Task")).not.toBeInTheDocument();
	});

	it("handles keyboard and microphone buttons", () => {
		const mockOnKeyboardClick = jest.fn();
		const mockOnMicrophoneClick = jest.fn();

		render(
			<FAB
				onTasksGenerated={mockOnTasksGenerated}
				onKeyboardClick={mockOnKeyboardClick}
				onMicrophoneClick={mockOnMicrophoneClick}
			/>,
		);

		// Open menu
		const mainButton = screen.getByRole("button");
		fireEvent.click(mainButton);

		const menuButtons = screen.getAllByRole("button");

		// Click keyboard button (first button, index 0)
		fireEvent.click(menuButtons[0]);
		expect(mockOnKeyboardClick).toHaveBeenCalledTimes(1);

		// Menu should close after clicking a button
		expect(screen.getAllByRole("button")).toHaveLength(1);

		// Open menu again
		fireEvent.click(mainButton);

		// Click microphone button (second button, index 1)
		fireEvent.click(screen.getAllByRole("button")[1]);
		expect(mockOnMicrophoneClick).toHaveBeenCalledTimes(1);

		// Menu should close after clicking a button
		expect(screen.getAllByRole("button")).toHaveLength(1);
	});
});
