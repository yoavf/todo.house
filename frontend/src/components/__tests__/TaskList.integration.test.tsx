import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tasksAPI } from "@/lib/api";
import { TaskList } from "../TaskList";

jest.mock("@/lib/api", () => ({
	tasksAPI: {
		getTasks: jest.fn(),
		createTask: jest.fn(),
		updateTask: jest.fn(),
		deleteTask: jest.fn(),
	},
}));

const mockTasksAPI = tasksAPI as jest.Mocked<typeof tasksAPI>;

describe("TaskList Integration", () => {
	// Mock console.error to avoid noise in test output
	const originalConsoleError = console.error;
	beforeAll(() => {
		console.error = jest.fn();
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	const mockTasks = [
		{
			id: 1,
			title: "Task 1",
			description: "Description 1",
			priority: "medium" as const,
			completed: false,
			status: "active" as const,
			source: "manual" as const,
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
			user_id: "test-user",
		},
		{
			id: 2,
			title: "Task 2",
			description: "Description 2",
			priority: "high" as const,
			completed: true,
			status: "completed" as const,
			source: "manual" as const,
			created_at: "2024-01-02T00:00:00Z",
			updated_at: "2024-01-02T00:00:00Z",
			user_id: "test-user",
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("loads and displays tasks on mount", async () => {
		mockTasksAPI.getTasks.mockResolvedValue(mockTasks);

		render(<TaskList />);

		expect(screen.getByText("Loading tasks...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("Task 1")).toBeInTheDocument();
			expect(screen.getByText("Task 2")).toBeInTheDocument();
		});

		expect(mockTasksAPI.getTasks).toHaveBeenCalledTimes(1);
	});

	it("shows empty state when no tasks", async () => {
		mockTasksAPI.getTasks.mockResolvedValue([]);

		render(<TaskList />);

		await waitFor(() => {
			expect(
				screen.getByText(
					"No tasks yet. Create your first task above or upload an image to generate tasks automatically!",
				),
			).toBeInTheDocument();
		});
	});

	it("creates a new task", async () => {
		const user = userEvent.setup();
		mockTasksAPI.getTasks.mockResolvedValue([]);
		mockTasksAPI.createTask.mockResolvedValue({
			id: 3,
			title: "New Task",
			description: "New Description",
			priority: "medium" as const,
			completed: false,
			status: "active" as const,
			source: "manual" as const,
			created_at: "2024-01-03T00:00:00Z",
			updated_at: "2024-01-03T00:00:00Z",
			user_id: "test-user",
		});

		render(<TaskList />);

		await waitFor(() => {
			expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
		});

		const titleInput = screen.getByPlaceholderText("Task title");
		const descriptionInput = screen.getByPlaceholderText(
			"Task description (optional)",
		);
		const addButton = screen.getByText("Add Task");

		await user.type(titleInput, "New Task");
		await user.type(descriptionInput, "New Description");
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("New Task")).toBeInTheDocument();
		});

		expect(mockTasksAPI.createTask).toHaveBeenCalledWith({
			title: "New Task",
			description: "New Description",
		});
	});

	it("updates a task", async () => {
		mockTasksAPI.getTasks.mockResolvedValue([mockTasks[0]]);
		mockTasksAPI.updateTask.mockResolvedValue({
			...mockTasks[0],
			completed: true,
		});

		render(<TaskList />);

		await waitFor(() => {
			expect(screen.getByText("Task 1")).toBeInTheDocument();
		});

		const checkbox = screen.getByRole("checkbox");
		fireEvent.click(checkbox);

		await waitFor(() => {
			expect(mockTasksAPI.updateTask).toHaveBeenCalledWith(1, {
				completed: true,
			});
		});
	});

	it("deletes a task", async () => {
		mockTasksAPI.getTasks.mockResolvedValue([mockTasks[0]]);
		mockTasksAPI.deleteTask.mockResolvedValue();

		render(<TaskList />);

		await waitFor(() => {
			expect(screen.getByText("Task 1")).toBeInTheDocument();
		});

		const deleteButton = screen.getByText("Delete");
		fireEvent.click(deleteButton);

		await waitFor(() => {
			expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
		});

		expect(mockTasksAPI.deleteTask).toHaveBeenCalledWith(1);
	});

	it("handles API errors gracefully", async () => {
		mockTasksAPI.getTasks.mockRejectedValue(new Error("Network error"));

		render(<TaskList />);

		await waitFor(() => {
			expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
		});
	});

	it("shows error when task creation fails", async () => {
		const user = userEvent.setup();
		mockTasksAPI.getTasks.mockResolvedValue([]);
		mockTasksAPI.createTask.mockRejectedValue(new Error("Creation failed"));

		render(<TaskList />);

		await waitFor(() => {
			expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
		});

		const titleInput = screen.getByPlaceholderText("Task title");
		const addButton = screen.getByText("Add Task");

		await user.type(titleInput, "New Task");
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("Failed to create task")).toBeInTheDocument();
		});
	});
});
