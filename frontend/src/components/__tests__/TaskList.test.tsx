import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskProvider } from "@/contexts/TaskContext";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/api";
import { TaskList } from "../TaskList";

// Mock next/navigation
const mockPush = jest.fn();
const mockUsePathname = jest.fn(() => "/");
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
	}),
	usePathname: () => mockUsePathname(),
}));

// Mock the useTasks hook
jest.mock("@/hooks/useTasks");

const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;

describe("TaskList", () => {
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

	// Helper function to create mock tasks state
	const getMockTasksState = (
		overrides: Partial<ReturnType<typeof useTasks>> = {},
	) => ({
		tasks: mockTasks,
		loading: false,
		error: null,
		updateTask: mockUpdateTask,
		deleteTask: mockDeleteTask,
		refetch: jest.fn(),
		...overrides,
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockPush.mockClear();
		mockUsePathname.mockReturnValue("/");
		mockUseTasks.mockReturnValue(getMockTasksState());
	});

	it("renders loading state with test-id", () => {
		mockUseTasks.mockReturnValue(
			getMockTasksState({ tasks: [], loading: true }),
		);

		const { container } = render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);
		const spinner = container.querySelector(".animate-spin");
		expect(spinner).toHaveAttribute("data-testid", "loading-spinner");
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
	});

	it("renders error state", () => {
		mockUseTasks.mockReturnValue(
			getMockTasksState({ tasks: [], error: "Failed to fetch tasks" }),
		);

		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
		expect(screen.getByText("Failed to fetch tasks")).toBeInTheDocument();
	});

	it("renders tasks with correct categories", async () => {
		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		// First task is visible in do-next tab
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.getByText("Plumbing")).toBeInTheDocument();

		// Clean gutters is also in do-next tab
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();
		expect(screen.getByText("Outdoor")).toBeInTheDocument();

		// Replace light bulbs is in later/snoozed tab, not visible by default
		expect(screen.queryByText("Replace light bulbs")).not.toBeInTheDocument();
	});

	it("navigates to correct URLs when tabs are clicked", async () => {
		const user = userEvent.setup();
		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		// Do next tab (default) - should show active tasks including AI generated
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.queryByText("Replace light bulbs")).not.toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument(); // AI generated now goes to do-next

		// Click Later tab - should navigate to /snoozed
		await user.click(screen.getByRole("button", { name: "Later" }));
		expect(mockPush).toHaveBeenCalledWith("/snoozed");

		// Click All tab - should navigate to /tasks
		await user.click(screen.getByRole("button", { name: "All" }));
		expect(mockPush).toHaveBeenCalledWith("/tasks");

		// Click Do next tab - should navigate to /
		await user.click(screen.getByRole("button", { name: "Do next" }));
		expect(mockPush).toHaveBeenCalledWith("/");
	});

	it("shows all tasks when on /tasks route", () => {
		// Mock the pathname to be /tasks
		mockUsePathname.mockReturnValue("/tasks");

		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		// Check that all tasks are displayed
		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.getByText("Replace light bulbs")).toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();
	});

	it("shows empty state when no tasks in category", () => {
		mockUseTasks.mockReturnValue(getMockTasksState({ tasks: [] }));

		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		expect(screen.getByText("No tasks in this category")).toBeInTheDocument();
	});

	it("maps task types to correct icons", () => {
		// Mock the pathname to be /tasks to see all tasks
		mockUsePathname.mockReturnValue("/tasks");

		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		// Check that tasks are rendered with their categories
		expect(screen.getByText("Plumbing")).toBeInTheDocument();
		expect(screen.getByText("Electrical")).toBeInTheDocument();
		expect(screen.getByText("Outdoor")).toBeInTheDocument(); // exterior maps to Outdoor
	});

	it("shows link to all tasks page", () => {
		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		const allTasksLink = screen.getByText("All tasks >");
		expect(allTasksLink).toBeInTheDocument();
		expect(allTasksLink.closest("a")).toHaveAttribute("href", "/tasks");
	});
});
