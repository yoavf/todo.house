import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TypingView } from "../TypingView";

const mockOnClose = jest.fn();
const mockOnTaskCreated = jest.fn();

describe("TypingView", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("does not render when not open", () => {
		render(
			<TypingView
				isOpen={false}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
			/>,
		);
		expect(screen.queryByText("tasks.actions.createTask")).not.toBeInTheDocument();
	});

	it("renders when open", () => {
		render(
			<TypingView
				isOpen={true}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
			/>,
		);
		expect(screen.getByText("tasks.actions.createTask")).toBeInTheDocument();
	});

	it("calls onClose when the close button is clicked", () => {
		render(
			<TypingView
				isOpen={true}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Close"));
		expect(mockOnClose).toHaveBeenCalled();
	});

	it("enables continue buttons when title is entered", () => {
		render(
			<TypingView
				isOpen={true}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
			/>,
		);
		const titleInput = screen.getByPlaceholderText(
			"tasks.placeholders.taskTitlePlaceholder",
		);
		fireEvent.change(titleInput, { target: { value: "Test Task" } });
		expect(
			screen.getByText("tasks.actions.continueManually"),
		).toBeInTheDocument();
		expect(
			screen.getByText("tasks.actions.completeWithAI"),
		).toBeInTheDocument();
	});

	it("creates a task with title and description", async () => {
		render(
			<TypingView
				isOpen={true}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
			/>,
		);

		const titleInput = screen.getByPlaceholderText(
			"tasks.placeholders.taskTitlePlaceholder",
		);
		fireEvent.change(titleInput, { target: { value: "Test Task" } });

		fireEvent.click(screen.getByText("tasks.actions.continueManually"));

		const descriptionInput = screen.getByPlaceholderText(
			"tasks.placeholders.descriptionPlaceholder",
		);
		fireEvent.change(descriptionInput, {
			target: { value: "Test Description" },
		});

		fireEvent.click(screen.getByText("common.addTask"));

		await waitFor(() => {
			expect(mockOnTaskCreated).toHaveBeenCalledWith({
				title: "Test Task",
				description: "Test Description",
				priority: "medium",
				source: "manual",
			});
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	it("creates a task with sourceImageId", async () => {
		render(
			<TypingView
				isOpen={true}
				onClose={mockOnClose}
				onTaskCreated={mockOnTaskCreated}
				sourceImageId="test-image-id"
			/>,
		);

		const titleInput = screen.getByPlaceholderText(
			"tasks.placeholders.taskTitlePlaceholder",
		);
		fireEvent.change(titleInput, { target: { value: "Test Task" } });
		fireEvent.click(screen.getByText("tasks.actions.continueManually"));

		fireEvent.click(screen.getByText("common.addTask"));

		await waitFor(() => {
			expect(mockOnTaskCreated).toHaveBeenCalledWith({
				title: "Test Task",
                description: "",
				priority: "medium",
				source: "manual",
				source_image_id: "test-image-id",
			});
			expect(mockOnClose).toHaveBeenCalled();
		});
	});
});
