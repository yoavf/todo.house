import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeIcon } from "lucide-react";
import * as React from "react";
import { TaskItem } from "../TaskItem";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		back: jest.fn(),
	}),
}));

// Mock framer-motion with animation tracking
jest.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			drag,
			dragConstraints,
			dragElastic,
			onDragEnd,
			animate,
			style,
			onClick,
			initial,
			exit,
			variants,
			layout,
			...props
		}: React.PropsWithChildren<Record<string, unknown>>) => (
			// biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: Mock component for testing
			<div onClick={onClick} style={style} {...props}>
				{children}
			</div>
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
	AnimatePresence: ({ children }: any) => {
		return <div data-testid="animate-presence">{children}</div>;
	},
}));

// Mock API
jest.mock("@/lib/api", () => ({
	tasksAPI: {
		updateTask: jest.fn().mockResolvedValue({}),
		deleteTask: jest.fn().mockResolvedValue({}),
		unsnoozeTask: jest.fn().mockResolvedValue({}),
	},
}));

// Mock dropdown menu components
jest.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({
		children,
		asChild,
		...props
	}: {
		children: React.ReactNode;
		asChild?: boolean;
	}) => {
		if (asChild) {
			return <>{children}</>;
		}
		return <button {...props}>{children}</button>;
	},
	DropdownMenuContent: ({
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick?: (e: React.MouseEvent) => void;
	}) => (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: Mock component for testing
		<div onClick={onClick} {...props}>
			{children}
		</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick?: (e: React.MouseEvent) => void;
	}) => (
		<button onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

// Mock Dialog components
jest.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		children,
		open,
	}: {
		children: React.ReactNode;
		open?: boolean;
	}) => (open ? <div data-testid="dialog">{children}</div> : null),
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2>{children}</h2>
	),
	DialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

// Mock Button component
jest.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	}) => (
		<button onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
}));

// Mock SnoozeModal
jest.mock("../SnoozeModal", () => ({
	SnoozeModal: ({
		isOpen,
		onSnooze,
	}: {
		isOpen: boolean;
		onSnooze: (date: Date) => void;
	}) =>
		isOpen ? (
			<div data-testid="snooze-modal">
				<button
					type="button"
					onClick={() => {
						const tomorrow = new Date();
						tomorrow.setDate(tomorrow.getDate() + 1);
						onSnooze(tomorrow);
					}}
				>
					Snooze until tomorrow
				</button>
			</div>
		) : null,
}));

// Mock AnimatedTaskItem to track props
// biome-ignore lint/suspicious/noExplicitAny: Mock type for testing
let animatedTaskItemProps: any = {};
jest.mock("../AnimatedTaskItem", () => ({
	AnimatedTaskItem: ({
		children,
		taskId,
		isRemoving,
		onAnimationComplete,
		// biome-ignore lint/suspicious/noExplicitAny: Mock type for testing
	}: any) => {
		animatedTaskItemProps = { taskId, isRemoving, onAnimationComplete };
		// Simulate animation completion when isRemoving becomes true
		React.useEffect(() => {
			if (isRemoving && onAnimationComplete) {
				// Simulate animation delay
				const timer = setTimeout(() => {
					onAnimationComplete();
				}, 100);
				return () => clearTimeout(timer);
			}
		}, [isRemoving, onAnimationComplete]);

		return isRemoving ? null : (
			<div data-testid="animated-task-item">{children}</div>
		);
	},
}));

describe("TaskItem Animation Integration", () => {
	const mockTask = {
		id: 1,
		title: "Test Task",
		description: "Test Description",
		category: "Test Category",
		icon: HomeIcon,
		addedTime: "Just now",
		estimatedTime: "30m",
		status: "do-next",
	};

	const mockOnTaskUpdate = jest.fn();

	// Silence console methods
	const originalConsole = { ...console };

	beforeAll(() => {
		console.log = jest.fn();
		console.error = jest.fn();
		console.warn = jest.fn();
	});

	afterAll(() => {
		console.log = originalConsole.log;
		console.error = originalConsole.error;
		console.warn = originalConsole.warn;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		animatedTaskItemProps = {};
	});

	it("animates task removal on snooze", async () => {
		const { tasksAPI } = require("@/lib/api");
		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click snooze
		const snoozeButton = await screen.findByText("Snooze");
		fireEvent.click(snoozeButton);

		// Verify snooze modal appears
		expect(screen.getByTestId("snooze-modal")).toBeInTheDocument();

		// Select snooze option
		const snoozeUntilTomorrow = screen.getByText("Snooze until tomorrow");
		fireEvent.click(snoozeUntilTomorrow);

		// Wait for the timeout delay (200ms) then verify animation starts
		await waitFor(
			() => {
				expect(animatedTaskItemProps.isRemoving).toBe(true);
			},
			{ timeout: 500 },
		);

		// Verify task content is removed from DOM during animation
		expect(screen.queryByTestId("animated-task-item")).not.toBeInTheDocument();

		// Wait for animation to complete and API to be called
		await waitFor(() => {
			expect(tasksAPI.updateTask).toHaveBeenCalledWith(1, {
				status: "snoozed",
				snoozed_until: expect.any(String),
			});
		});

		// Verify task update callback was called
		expect(mockOnTaskUpdate).toHaveBeenCalled();
	});

	it("animates task removal on delete", async () => {
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

		// Verify delete confirmation dialog appears
		expect(screen.getByTestId("dialog")).toBeInTheDocument();
		expect(screen.getByText("Delete Task")).toBeInTheDocument();

		// Confirm delete - get the second Delete button (in dialog)
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
		const confirmDeleteButton = deleteButtons[1]; // The one in the dialog
		fireEvent.click(confirmDeleteButton);

		// Wait for the timeout delay (200ms) then verify animation starts
		await waitFor(
			() => {
				expect(animatedTaskItemProps.isRemoving).toBe(true);
			},
			{ timeout: 500 },
		);

		// Verify task content is removed from DOM during animation
		expect(screen.queryByTestId("animated-task-item")).not.toBeInTheDocument();

		// Wait for animation to complete and API to be called
		await waitFor(() => {
			expect(tasksAPI.deleteTask).toHaveBeenCalledWith(1);
		});

		// Verify task update callback was called
		expect(mockOnTaskUpdate).toHaveBeenCalled();
	});

	it("handles animation errors gracefully", async () => {
		const { tasksAPI } = require("@/lib/api");
		// Make API fail
		tasksAPI.updateTask.mockRejectedValueOnce(new Error("API Error"));

		render(<TaskItem task={mockTask} onTaskUpdate={mockOnTaskUpdate} />);

		// Open dropdown menu
		const buttons = screen.getAllByRole("button");
		const moreButton = buttons.find((button) =>
			button.querySelector(".lucide-ellipsis"),
		);
		expect(moreButton).toBeTruthy();
		if (moreButton) fireEvent.click(moreButton);

		// Click snooze
		const snoozeButton = await screen.findByText("Snooze");
		fireEvent.click(snoozeButton);

		// Select snooze option
		const snoozeUntilTomorrow = screen.getByText("Snooze until tomorrow");
		fireEvent.click(snoozeUntilTomorrow);

		// Wait for the timeout delay (200ms) then verify animation starts
		await waitFor(
			() => {
				expect(animatedTaskItemProps.isRemoving).toBe(true);
			},
			{ timeout: 500 },
		);

		// Wait for API error
		await waitFor(() => {
			expect(tasksAPI.updateTask).toHaveBeenCalled();
		});

		// Task should not be updated since API failed
		expect(mockOnTaskUpdate).not.toHaveBeenCalled();
	});

	it("animates task removal on unsnooze", async () => {
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

		// Verify animation starts immediately (no delay for unsnooze)
		await waitFor(() => {
			expect(animatedTaskItemProps.isRemoving).toBe(true);
		});

		// Verify task content is removed from DOM during animation
		expect(screen.queryByTestId("animated-task-item")).not.toBeInTheDocument();

		// Wait for animation to complete and API to be called
		await waitFor(() => {
			expect(tasksAPI.unsnoozeTask).toHaveBeenCalledWith(1);
		});

		// Verify task update callback was called
		expect(mockOnTaskUpdate).toHaveBeenCalled();
	});
});
