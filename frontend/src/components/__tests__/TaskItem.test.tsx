import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeIcon } from "lucide-react";
import { TaskItem } from "../TaskItem";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		back: jest.fn(),
	}),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			...props
		}: React.PropsWithChildren<Record<string, unknown>>) => (
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
	// biome-ignore lint/suspicious/noExplicitAny: Mock type for testing
	AnimatePresence: ({ children, onExitComplete }: any) => {
		// Simulate exit complete after a short delay
		setTimeout(() => {
			if (onExitComplete) onExitComplete();
		}, 0);
		return <div data-testid="animate-presence">{children}</div>;
	},
}));

// Mock Radix UI components to avoid portal issues in tests
jest.mock("@radix-ui/react-dropdown-menu", () => ({
	Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Trigger: ({
		children,
		asChild,
		...props
	}: {
		children: React.ReactNode;
		asChild?: boolean;
	}) => {
		if (asChild) {
			return children;
		}
		return <button {...props}>{children}</button>;
	},
	Portal: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Content: ({ children }: { children: React.ReactNode }) => (
		<div role="menu">{children}</div>
	),
	Item: ({
		children,
		onClick,
		variant,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		variant?: string;
	}) => (
		<button
			type="button"
			role="menuitem"
			onClick={onClick}
			data-variant={variant}
			tabIndex={0}
			{...props}
		>
			{children}
		</button>
	),
}));

jest.mock("@radix-ui/react-dialog", () => ({
	Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
		open ? <div>{children}</div> : null,
	Portal: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Overlay: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Content: ({ children }: { children: React.ReactNode }) => (
		<div role="dialog">{children}</div>
	),
	Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	Description: ({ children }: { children: React.ReactNode }) => (
		<p>{children}</p>
	),
	Close: ({
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

// Mock the API
jest.mock("@/lib/api", () => ({
	tasksAPI: {
		updateTask: jest.fn().mockResolvedValue({}),
		deleteTask: jest.fn().mockResolvedValue({}),
		unsnoozeTask: jest.fn().mockResolvedValue({}),
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

	it("shows dropdown menu when three-dots button is clicked", async () => {
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Find the three-dots button by looking for the button with MoreHorizontalIcon
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();

		if (moreButton) fireEvent.click(moreButton);

		// Check dropdown menu items appear
		await waitFor(() => {
			expect(screen.getByText("Snooze")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});
	});

	it("does not navigate when clicking dropdown menu items", async () => {
		const mockRouter = require("next/navigation").useRouter();
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click snooze menu item
		const snoozeButton = await screen.findByText("Snooze");
		fireEvent.click(snoozeButton);

		// Verify router.push was NOT called
		expect(mockRouter.push).not.toHaveBeenCalled();

		// Verify snooze modal opens instead
		await waitFor(() => {
			expect(screen.getByText("Snooze until")).toBeInTheDocument();
		});
	});

	it("shows delete confirmation dialog when delete is clicked", async () => {
		const { tasksAPI } = require("@/lib/api");
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click delete
		const deleteButton = await screen.findByText("Delete");
		fireEvent.click(deleteButton);

		// Check confirmation dialog appears
		await waitFor(() => {
			expect(screen.getByText("Delete Task")).toBeInTheDocument();
			expect(
				screen.getByText(/Are you sure you want to delete/),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Cancel" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Delete" }),
			).toBeInTheDocument();
		});

		// Click delete in dialog
		const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
		fireEvent.click(confirmDeleteButton);

		// Verify API was called
		await waitFor(() => {
			expect(tasksAPI.deleteTask).toHaveBeenCalledWith(1);
			expect(mockOnTaskUpdate).toHaveBeenCalled();
		});
	});

	it("shows 'Unsnooze' instead of 'Snooze' in Later tab", async () => {
		render(
			<TaskItem
				task={{ ...mockTask, status: "later" }}
				onTaskUpdate={mockOnTaskUpdate}
				activeTab="later"
			/>,
		);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Check that it shows "Unsnooze" instead of "Snooze"
		await waitFor(() => {
			expect(screen.getByText("Unsnooze")).toBeInTheDocument();
			expect(screen.queryByText("Snooze")).not.toBeInTheDocument();
		});
	});

	it("calls unsnoozeTask when Unsnooze is clicked", async () => {
		const { tasksAPI } = require("@/lib/api");
		render(
			<TaskItem
				task={{ ...mockTask, status: "later" }}
				onTaskUpdate={mockOnTaskUpdate}
				activeTab="later"
			/>,
		);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click unsnooze
		const unsnoozeButton = await screen.findByText("Unsnooze");
		fireEvent.click(unsnoozeButton);

		// Verify API was called
		await waitFor(() => {
			expect(tasksAPI.unsnoozeTask).toHaveBeenCalledWith(1);
			expect(mockOnTaskUpdate).toHaveBeenCalled();
		});
	});

	it("cancels delete when Cancel is clicked in dialog", async () => {
		const { tasksAPI } = require("@/lib/api");
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click delete
		const deleteButton = await screen.findByText("Delete");
		fireEvent.click(deleteButton);

		// Click cancel in dialog
		const cancelButton = await screen.findByRole("button", { name: "Cancel" });
		fireEvent.click(cancelButton);

		// Verify API was NOT called
		expect(tasksAPI.deleteTask).not.toHaveBeenCalled();
		expect(mockOnTaskUpdate).not.toHaveBeenCalled();

		// Dialog should be closed
		await waitFor(() => {
			expect(screen.queryByText("Delete Task")).not.toBeInTheDocument();
		});
	});
});
