import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { TaskList } from "../TaskList";
import { TaskProvider } from "@/contexts/TaskContext";

// Mock the hooks and API
jest.mock("next/navigation", () => ({
	usePathname: jest.fn(() => "/"),
	useRouter: jest.fn(),
}));

// Create stable mock objects to prevent infinite re-renders
const mockRefetch = jest.fn();
const mockTasksData = {
	tasks: [],
	loading: false,
	error: null,
	refetch: mockRefetch,
};

jest.mock("@/hooks/useTasks", () => ({
	useTasks: jest.fn(() => mockTasksData),
}));

jest.mock("@/hooks/useScrollRestoration", () => ({
	useScrollRestoration: jest.fn(() => ({
		saveScrollPosition: jest.fn(),
		restoreScrollPosition: jest.fn(),
		clearScrollPosition: jest.fn(),
	})),
}));

// Mock sessionStorage
const mockSessionStorage = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
	value: mockSessionStorage,
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
	value: jest.fn((cb) => setTimeout(cb, 0)),
});

const messages = {
	common: {
		doIt: "Do it",
		snooze: "Snooze",
		delete: "Delete",
		cancel: "Cancel",
		ok: "OK",
		unsnooze: "Unsnooze",
		goBack: "Go back",
	},
	tasks: {
		types: {
			maintenance: "Maintenance",
			repair: "Repair",
			interior: "Interior",
			exterior: "Exterior",
			electricity: "Electrical",
			plumbing: "Plumbing",
			appliances: "Appliances",
		},
		tabs: {
			guide: "Guide",
			shoppingList: "Shopping List",
			steps: "Steps",
		},
		fields: {
			category: "Category",
			location: "Location",
			title: "What needs to be done",
		},
		details: {
			taskDetails: "Task Details",
			estimatedTime: "Estimated Time",
			completed: "Completed",
		},
		actions: {
			markAsDone: "Mark as Done",
			generateGuide: "Generate Guide",
		},
	},
	errors: {
		invalidTaskId: "Invalid task ID",
		failedToLoadTask: "Failed to load task",
		failedToSnoozeTask: "Failed to snooze task",
		actionFailed: "Action failed: {action}",
	},
	dialogs: {
		deleteTask: "Delete Task",
		deleteTaskDescription: "Are you sure you want to delete '{title}'?",
		error: "Error",
	},
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<NextIntlClientProvider locale="en" messages={messages}>
		<TaskProvider>{children}</TaskProvider>
	</NextIntlClientProvider>
);

describe("TaskList Scroll Restoration", () => {
	let mockUseScrollRestoration: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockSessionStorage.getItem.mockClear();
		mockSessionStorage.setItem.mockClear();
		mockSessionStorage.removeItem.mockClear();

		// Get the mocked useScrollRestoration
		mockUseScrollRestoration = require("@/hooks/useScrollRestoration").useScrollRestoration;
	});

	it("should initialize scroll restoration with correct parameters", () => {
		render(<TaskList />, { wrapper: TestWrapper });

		expect(mockUseScrollRestoration).toHaveBeenCalledWith(undefined, {
			key: "task-list-do-next",
			saveOnRouteChange: true,
			restoreOnMount: true,
		});
	});

	it("should use different storage keys for different tabs", () => {
		const mockUsePathname = require("next/navigation").usePathname;

		// Test "later" tab
		mockUsePathname.mockReturnValue("/later");
		const { unmount } = render(<TaskList />, { wrapper: TestWrapper });

		expect(mockUseScrollRestoration).toHaveBeenCalledWith(undefined, {
			key: "task-list-later",
			saveOnRouteChange: true,
			restoreOnMount: true,
		});

		unmount();

		// Test "all" tab
		mockUsePathname.mockReturnValue("/tasks");
		const { unmount: unmount2 } = render(<TaskList />, { wrapper: TestWrapper });

		expect(mockUseScrollRestoration).toHaveBeenCalledWith(undefined, {
			key: "task-list-all",
			saveOnRouteChange: true,
			restoreOnMount: true,
		});

		unmount2();

		// Test default "do-next" tab
		mockUsePathname.mockReturnValue("/");
		render(<TaskList />, { wrapper: TestWrapper });

		expect(mockUseScrollRestoration).toHaveBeenCalledWith(undefined, {
			key: "task-list-do-next",
			saveOnRouteChange: true,
			restoreOnMount: true,
		});
	});

	it("should render task list with scroll restoration enabled", () => {
		render(<TaskList />, { wrapper: TestWrapper });

		// Check that the component renders
		expect(screen.getByTestId("task-list")).toBeInTheDocument();

		// Verify scroll restoration hook was called
		expect(mockUseScrollRestoration).toHaveBeenCalled();
	});
});