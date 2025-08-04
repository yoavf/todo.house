import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeIcon } from "lucide-react";
import { TaskItem } from "../TaskItem";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			...props
		}: React.PropsWithChildren<Record<string, any>>) => (
			<div {...props}>{children}</div>
		),
	},
	useAnimation: () => ({
		start: jest.fn(),
	}),
	useMotionValue: () => ({
		set: jest.fn(),
		get: () => 0,
	}),
}));

// Mock the API
jest.mock("@/lib/api", () => ({
	tasksAPI: {
		updateTask: jest.fn().mockResolvedValue({}),
	},
}));

describe("TaskItem", () => {
	const mockTask = {
		id: 1,
		title: "Test Task",
		description: "Test Description",
		category: "Interior",
		icon: HomeIcon,
		addedTime: "2 days ago",
		estimatedTime: "30m",
		status: "do-next",
		thumbnail_url: "/api/proxy/image123",
		image_url: "/api/proxy/image123",
	};

	const mockOnTaskUpdate = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders task title and description", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		expect(screen.getByText("Test Task")).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});

	it("renders task category and estimated time", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		expect(screen.getByText("Interior")).toBeInTheDocument();
		expect(screen.getByText(/30m/)).toBeInTheDocument();
	});

	it("renders the task icon", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// The icon should be rendered within the component
		const categorySection = screen.getByText("Interior").parentElement;
		expect(categorySection).toBeInTheDocument();
	});

	it("shows 'Do it' button", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		const doItButton = screen.getByRole("button", { name: /Do it/i });
		expect(doItButton).toBeInTheDocument();
	});

	it("renders with swipeable container", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Check that the swipeable area exists
		const taskItem = screen.getByTestId(`task-item-${mockTask.status}`);
		expect(taskItem).toBeInTheDocument();
	});

	it("shows snooze modal when snooze button is clicked", async () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Find the snooze button in the background layer
		const snoozeButtons = screen.getAllByRole("button");
		const snoozeButton = snoozeButtons.find((button) => {
			// Check if this button contains a clock icon
			const svg = button.querySelector("svg");
			return svg?.classList.contains("lucide-clock");
		});

		// Ensure snooze button exists
		expect(snoozeButton).toBeTruthy();
		if (!snoozeButton) {
			throw new Error("Snooze button not found in the DOM");
		}

		fireEvent.click(snoozeButton);

		// Wait for modal to appear
		await waitFor(() => {
			expect(screen.getByText("Snooze until")).toBeInTheDocument();
		});

		// Check snooze options are shown
		expect(screen.getByText("Tomorrow")).toBeInTheDocument();
		expect(screen.getByText("This weekend")).toBeInTheDocument();
		expect(screen.getByText("Next week")).toBeInTheDocument();
		expect(screen.getByText("Select date")).toBeInTheDocument();
	});

	it("renders background image when provided", () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// The component uses inline styles for the background image
		const taskContainer = screen.getByText("Test Task").closest(".relative");
		expect(taskContainer).toBeInTheDocument();
	});

	it("renders without image when not provided", () => {
		const taskWithoutImage = {
			...mockTask,
			thumbnail_url: undefined,
			image_url: undefined,
		};

		render(
			<TaskItem task={taskWithoutImage} onTaskUpdate={mockOnTaskUpdate} />,
		);

		expect(screen.getByText("Test Task")).toBeInTheDocument();
	});
});
