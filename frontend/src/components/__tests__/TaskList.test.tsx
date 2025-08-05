import { render, screen } from "@testing-library/react";
import { addDays, addWeeks } from "date-fns";
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

	it("shows correct tasks based on pathname", () => {
		// Do next tab (default) - should show active tasks including AI generated
		render(
			<TaskProvider>
				<TaskList />
			</TaskProvider>,
		);

		expect(screen.getByText("Fix leaking faucet")).toBeInTheDocument();
		expect(screen.queryByText("Replace light bulbs")).not.toBeInTheDocument();
		expect(screen.getByText("Clean gutters")).toBeInTheDocument(); // AI generated now goes to do-next
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

	describe("time-organized later tab", () => {
		beforeAll(() => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date("2024-01-15T10:00:00Z")); // Monday
		});

		afterAll(() => {
			jest.useRealTimers();
		});

		it("organizes snoozed tasks by time periods in later tab", () => {
			const now = new Date("2024-01-15T10:00:00Z");
			const thisWeekDate = addDays(now, 2).toISOString(); // Wednesday this week
			const nextWeekDate = addWeeks(now, 1).toISOString(); // Next week
			const laterDate = addWeeks(now, 3).toISOString(); // 3 weeks from now

			const timeOrganizedTasks: Task[] = [
				{
					...mockTasks[0],
					id: 10,
					title: "This week task",
					status: "snoozed",
					snoozed_until: thisWeekDate,
				},
				{
					...mockTasks[1],
					id: 11,
					title: "Next week task",
					status: "snoozed",
					snoozed_until: nextWeekDate,
				},
				{
					...mockTasks[2],
					id: 12,
					title: "Later task",
					status: "snoozed",
					snoozed_until: laterDate,
				},
			];

			mockUsePathname.mockReturnValue("/later");
			mockUseTasks.mockReturnValue(
				getMockTasksState({ tasks: timeOrganizedTasks }),
			);

			render(
				<TaskProvider>
					<TaskList />
				</TaskProvider>,
			);

			// Check section headers are displayed
			expect(screen.getByText("This week")).toBeInTheDocument();
			expect(screen.getByText("Next week")).toBeInTheDocument();
			expect(
				screen.getByRole("heading", { name: "Later" }),
			).toBeInTheDocument();

			// Check tasks are displayed
			expect(screen.getByText("This week task")).toBeInTheDocument();
			expect(screen.getByText("Next week task")).toBeInTheDocument();
			expect(screen.getByText("Later task")).toBeInTheDocument();
		});

		it("shows single list without headers when only later tasks exist", () => {
			const laterDate = addWeeks(
				new Date("2024-01-15T10:00:00Z"),
				3,
			).toISOString();

			const laterOnlyTasks: Task[] = [
				{
					...mockTasks[0],
					id: 20,
					title: "Only later task 1",
					status: "snoozed",
					snoozed_until: laterDate,
				},
				{
					...mockTasks[1],
					id: 21,
					title: "Only later task 2",
					status: "snoozed",
					snoozed_until: laterDate,
				},
			];

			mockUsePathname.mockReturnValue("/later");
			mockUseTasks.mockReturnValue(
				getMockTasksState({ tasks: laterOnlyTasks }),
			);

			render(
				<TaskProvider>
					<TaskList />
				</TaskProvider>,
			);

			// Section headers should NOT be displayed
			expect(screen.queryByText("This week")).not.toBeInTheDocument();
			expect(screen.queryByText("Next week")).not.toBeInTheDocument();
			expect(
				screen.queryByRole("heading", { name: "Later" }),
			).not.toBeInTheDocument();

			// Tasks should still be displayed
			expect(screen.getByText("Only later task 1")).toBeInTheDocument();
			expect(screen.getByText("Only later task 2")).toBeInTheDocument();
		});

		it("hides empty sections in later tab", () => {
			const nextWeekDate = addWeeks(
				new Date("2024-01-15T10:00:00Z"),
				1,
			).toISOString();

			const partialTasks: Task[] = [
				{
					...mockTasks[0],
					id: 30,
					title: "Next week only task",
					status: "snoozed",
					snoozed_until: nextWeekDate,
				},
			];

			mockUsePathname.mockReturnValue("/later");
			mockUseTasks.mockReturnValue(getMockTasksState({ tasks: partialTasks }));

			render(
				<TaskProvider>
					<TaskList />
				</TaskProvider>,
			);

			// Only next week section should be shown
			expect(screen.queryByText("This week")).not.toBeInTheDocument();
			expect(screen.getByText("Next week")).toBeInTheDocument();
			expect(
				screen.queryByRole("heading", { name: "Later" }),
			).not.toBeInTheDocument();

			expect(screen.getByText("Next week only task")).toBeInTheDocument();
		});
	});
});
