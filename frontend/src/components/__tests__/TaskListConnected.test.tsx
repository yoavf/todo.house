import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/api";
import { TaskListConnected } from "../TaskListConnected";

// Mock the useTasks hook
jest.mock("@/hooks/useTasks");

const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;

describe("TaskListConnected", () => {
	const mockUpdateTask = jest.fn();
	const mockDeleteTask = jest.fn();

	const mockTasks: Task[] = [
		{
			id: 1,
			title: "Fix leaking faucet",
			description: "Kitchen sink needs repair",
			priority: "high",
			completed: false,
			status: "active",
			source: "manual",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			user_id: "test-user",
			task_types: ["plumbing"],
		},
		{
			id: 2,
			title: "Replace light bulbs",
			description: "Living room lights",
			priority: "medium",
			completed: false,
			status: "snoozed",
			source: "manual",
			created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
			updated_at: new Date(Date.now() - 86400000).toISOString(),
			user_id: "test-user",
			task_types: ["electricity"],
		},
		{
			id: 3,
			title: "Clean gutters",
			description: "Suggested maintenance task",
			priority: "low",
			completed: false,
			status: "active",
			source: "ai_generated",
			created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
			updated_at: new Date(Date.now() - 172800000).toISOString(),
			user_id: "test-user",
			task_types: ["exterior", "maintenance"],
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseTasks.mockReturnValue({
			tasks: mockTasks,
			loading: false,
			error: null,
			updateTask: mockUpdateTask,
			deleteTask: mockDeleteTask,
			refetch: jest.fn(),
		});
	});

	it("renders loading state", () => {
		mockUseTasks.mockReturnValue({
			tasks: [],
			loading: true,
			error: null,
			updateTask: mockUpdateTask,
			deleteTask: mockDeleteTask,
			refetch: jest.fn(),
		});

		render(<TaskListConnected />);

		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
	});

	it("renders error state", () => {
		mockUseTasks.mockReturnValue({
			tasks: [],
			loading: false,
			error: "Failed to fetch tasks",
			updateTask: mockUpdateTask,
			deleteTask: mockDeleteTask,
			refetch: jest.fn(),
		});

		render(<TaskListConnected />);

		expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
		expect(screen.getByText("Failed to fetch tasks")).toBeInTheDocument();
	});

	it("renders tasks with correct categories", () => {
		render(<TaskListConnected />);

		// First task is visible in do-next tab
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.getByText("Plumbing")).toBeInTheDocument();

		// Switch to All tab to see all tasks
		fireEvent.click(screen.getByRole("button", { name: "All" }));

		expect(screen.getByText("Replace light bulbs")).toBeInTheDocument();
		expect(screen.getByText("Electrical")).toBeInTheDocument();
	});

	it("filters tasks by tab", () => {
		render(<TaskListConnected />);

		// Do next tab (default) - should show active tasks
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.queryByText("Replace light bulbs")).not.toBeInTheDocument();
		expect(screen.queryByText("Clean gutters")).not.toBeInTheDocument();

		// Later tab - should show snoozed tasks
		fireEvent.click(screen.getByRole("button", { name: "Later" }));
		expect(screen.queryByText("Fix leaking faucet")).not.toBeInTheDocument();
		expect(screen.getByText("Replace light bulbs")).toBeInTheDocument();
		expect(screen.queryByText("Clean gutters")).not.toBeInTheDocument();

		// Suggested tab - should show AI generated tasks
		fireEvent.click(screen.getByRole("button", { name: "Suggested" }));
		expect(screen.queryByText("Fix leaking faucet")).not.toBeInTheDocument();
		expect(screen.queryByText("Replace light bulbs")).not.toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();

		// All tab - should show all tasks
		fireEvent.click(screen.getByRole("button", { name: "All" }));
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.getByText("Replace light bulbs")).toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();
	});

	it("shows all tasks when All tab is selected", () => {
		render(<TaskListConnected />);

		fireEvent.click(screen.getByRole("button", { name: "All" }));

		// Check that all tasks are displayed
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.getByText("Replace light bulbs")).toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();
	});

	it("handles task action when clicked", async () => {
		render(<TaskListConnected />);

		const taskItem = screen
			.getByText("Fix leaking faucet")
			.closest('[role="button"]');
		fireEvent.click(taskItem!);

		await waitFor(() => {
			expect(mockUpdateTask).toHaveBeenCalledWith(1, {
				completed: true,
				status: "completed",
			});
		});
	});

	it("handles keyboard interaction for task action", async () => {
		render(<TaskListConnected />);

		const taskItem = screen
			.getByText("Fix leaking faucet")
			.closest('[role="button"]');

		// Test Enter key
		fireEvent.keyDown(taskItem!, { key: "Enter" });
		await waitFor(() => {
			expect(mockUpdateTask).toHaveBeenCalledWith(1, {
				completed: true,
				status: "completed",
			});
		});

		// Clear mock
		mockUpdateTask.mockClear();

		// Test Space key
		fireEvent.keyDown(taskItem!, { key: " " });
		await waitFor(() => {
			expect(mockUpdateTask).toHaveBeenCalledWith(1, {
				completed: true,
				status: "completed",
			});
		});
	});

	it("shows empty state when no tasks in category", () => {
		mockUseTasks.mockReturnValue({
			tasks: [],
			loading: false,
			error: null,
			updateTask: mockUpdateTask,
			deleteTask: mockDeleteTask,
			refetch: jest.fn(),
		});

		render(<TaskListConnected />);

		expect(screen.getByText("No tasks in this category")).toBeInTheDocument();
	});

	it("maps task types to correct icons", () => {
		render(<TaskListConnected />);

		fireEvent.click(screen.getByRole("button", { name: "All" }));

		// Check that tasks are rendered with their categories
		expect(screen.getByText("Plumbing")).toBeInTheDocument();
		expect(screen.getByText("Electrical")).toBeInTheDocument();
		expect(screen.getByText("Outdoor")).toBeInTheDocument(); // exterior maps to Outdoor
	});

	it("shows link to all tasks page", () => {
		render(<TaskListConnected />);

		const allTasksLink = screen.getByText("All tasks >");
		expect(allTasksLink).toBeInTheDocument();
		expect(allTasksLink.closest("a")).toHaveAttribute("href", "/tasks");
	});

	it("adds test-id to loading spinner", () => {
		mockUseTasks.mockReturnValue({
			tasks: [],
			loading: true,
			error: null,
			updateTask: mockUpdateTask,
			deleteTask: mockDeleteTask,
			refetch: jest.fn(),
		});

		const { container } = render(<TaskListConnected />);
		const spinner = container.querySelector(".animate-spin");
		expect(spinner).toHaveAttribute("data-testid", "loading-spinner");
	});
});
