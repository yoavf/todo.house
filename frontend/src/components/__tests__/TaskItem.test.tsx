import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Task, TaskType } from "@/lib/api";
import { TaskItem } from "../TaskItem";

describe("TaskItem", () => {
	const mockTask: Task = {
		id: 1,
		title: "Test Task",
		description: "Test Description",
		priority: "medium",
		completed: false,
		status: "active",
		source: "manual",
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		user_id: "test-user",
	};

	const mockOnUpdate = jest.fn();
	const mockOnDelete = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders task title and description", () => {
		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.getByText("Test Task")).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});

	it("shows strikethrough when task is completed", () => {
		const completedTask = { ...mockTask, completed: true };
		render(
			<TaskItem
				task={completedTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const title = screen.getByText("Test Task");
		expect(title).toHaveClass("line-through");
	});

	it("calls onUpdate when checkbox is toggled", () => {
		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		fireEvent.click(checkbox);

		expect(mockOnUpdate).toHaveBeenCalledWith(1, { completed: true });
	});

	it("calls onDelete when delete button is clicked", () => {
		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const deleteButton = screen.getByLabelText("Delete task");
		fireEvent.click(deleteButton);

		expect(mockOnDelete).toHaveBeenCalledWith(1);
	});

	it("enters edit mode when edit button is clicked", () => {
		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const editButton = screen.getByLabelText("Edit task");
		fireEvent.click(editButton);

		expect(screen.getByDisplayValue(mockTask.title)).toBeInTheDocument();
		expect(
			screen.getByDisplayValue(mockTask.description || ""),
		).toBeInTheDocument();
	});

	it("updates task when save is clicked in edit mode", async () => {
		const user = userEvent.setup();

		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const editButton = screen.getByLabelText("Edit task");
		fireEvent.click(editButton);

		const titleInput = screen.getByDisplayValue(mockTask.title);
		const descriptionInput = screen.getByPlaceholderText(
			"Task description (optional)",
		);

		await user.clear(titleInput);
		await user.type(titleInput, "Updated Task");
		await user.clear(descriptionInput);
		await user.type(descriptionInput, "Updated Description");

		const saveButton = screen.getByText("Save");
		fireEvent.click(saveButton);

		expect(mockOnUpdate).toHaveBeenCalledWith(1, {
			title: "Updated Task",
			description: "Updated Description",
		});
	});

	it("cancels edit mode without saving changes", async () => {
		const user = userEvent.setup();

		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		const editButton = screen.getByLabelText("Edit task");
		fireEvent.click(editButton);

		const titleInput = screen.getByDisplayValue(mockTask.title);
		await user.clear(titleInput);
		await user.type(titleInput, "Should not be saved");

		const cancelButton = screen.getByText("Cancel");
		fireEvent.click(cancelButton);

		expect(mockOnUpdate).not.toHaveBeenCalled();
		expect(screen.getByText("Test Task")).toBeInTheDocument();
	});

	it("displays task type badges when task has types", () => {
		const taskWithTypes = {
			...mockTask,
			task_types: ["interior", "electricity", "repair"] as TaskType[],
		};

		render(
			<TaskItem
				task={taskWithTypes}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.getByText("interior")).toBeInTheDocument();
		expect(screen.getByText("electricity")).toBeInTheDocument();
		expect(screen.getByText("repair")).toBeInTheDocument();
	});

	it("does not display task type badges when task has no types", () => {
		render(
			<TaskItem
				task={mockTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		// Check that no task type badges are rendered
		expect(screen.queryByText("interior")).not.toBeInTheDocument();
		expect(screen.queryByText("exterior")).not.toBeInTheDocument();
		expect(screen.queryByText("electricity")).not.toBeInTheDocument();
		expect(screen.queryByText("plumbing")).not.toBeInTheDocument();
		expect(screen.queryByText("appliances")).not.toBeInTheDocument();
		expect(screen.queryByText("maintenance")).not.toBeInTheDocument();
		expect(screen.queryByText("repair")).not.toBeInTheDocument();
	});

	it("displays AI generated indicator with task types", () => {
		const aiTask = {
			...mockTask,
			source: "ai_generated" as const,
			source_image_id: "test-image-id",
			ai_confidence: 0.85,
			task_types: ["maintenance", "interior"] as TaskType[],
		};

		render(
			<TaskItem
				task={aiTask}
				onUpdate={mockOnUpdate}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.getByText("AI Generated")).toBeInTheDocument();
		expect(screen.getByText("(85% confidence)")).toBeInTheDocument();
		expect(screen.getByText("maintenance")).toBeInTheDocument();
		expect(screen.getByText("interior")).toBeInTheDocument();
	});
});
