import { fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import { TaskCard } from "../../components/TaskCard";
import { useTaskStore } from "../../store/taskStore";
import type { Task } from "../../types/Task";

jest.mock("../../store/taskStore", () => ({
	useTaskStore: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({
	Ionicons: "Ionicons",
}));

jest.spyOn(Alert, "alert");

describe("TaskCard", () => {
	const mockToggle = jest.fn();
	const mockRemove = jest.fn();
	const mockUpdate = jest.fn();
	const mockClearRecentlyAdded = jest.fn();

	const mockTask: Task = {
		id: "test-1",
		title: "Test Task",
		completed: false,
		location: "Kitchen",
		createdAt: new Date("2024-01-01"),
		order: 0,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		// Mock useTaskStore to handle both direct usage and selector usage
		(useTaskStore as unknown as jest.Mock).mockImplementation(
			(selector?: (state: any) => any) => {
				const state = {
					toggle: mockToggle,
					remove: mockRemove,
					update: mockUpdate,
					recentlyAddedId: null,
					clearRecentlyAdded: mockClearRecentlyAdded,
					tasks: [],
				};

				// If a selector is provided, call it with the state
				if (selector) {
					return selector(state);
				}

				// Otherwise return the full state
				return state;
			},
		);
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it("renders task correctly", () => {
		const { getByText } = render(<TaskCard task={mockTask} />);

		expect(getByText("Test Task")).toBeTruthy();
		expect(getByText("in Kitchen")).toBeTruthy();
	});

	it("toggles task completion when checkbox is pressed", () => {
		const { getByTestId } = render(<TaskCard task={mockTask} />);

		const checkbox = getByTestId("task-checkbox");
		fireEvent.press(checkbox);

		expect(mockToggle).toHaveBeenCalledWith("test-1");
	});

	it("shows delete confirmation when delete button is pressed", () => {
		const { getByTestId } = render(<TaskCard task={mockTask} />);

		const deleteButton = getByTestId("delete-button");
		fireEvent.press(deleteButton);

		expect(Alert.alert).toHaveBeenCalledWith(
			"Delete Task",
			"Are you sure you want to delete this task?",
			expect.arrayContaining([
				{ text: "Cancel", style: "cancel" },
				{ text: "Delete", style: "destructive", onPress: expect.any(Function) },
			]),
		);
	});

	it("deletes task when delete is confirmed", () => {
		const { getByTestId } = render(<TaskCard task={mockTask} />);

		const deleteButton = getByTestId("delete-button");
		fireEvent.press(deleteButton);

		// Find the Alert.alert call and get the delete button's onPress callback
		const alertCalls = (Alert.alert as jest.Mock).mock.calls;
		const deleteAlertCall = alertCalls.find(
			(call) => call[0] === "Delete Task",
		);
		expect(deleteAlertCall).toBeDefined();

		const deleteOption = deleteAlertCall[2].find(
			(button: any) => button.text === "Delete",
		);
		expect(deleteOption).toBeDefined();

		deleteOption.onPress();

		expect(mockRemove).toHaveBeenCalledWith("test-1");
	});

	it("opens title edit when title is pressed", () => {
		const { getByTestId, getByDisplayValue } = render(
			<TaskCard task={mockTask} />,
		);

		const titleEdit = getByTestId("title-edit");
		fireEvent.press(titleEdit);

		// Should show input field with current title
		expect(getByDisplayValue("Test Task")).toBeTruthy();
	});

	it("shows recently added highlight", () => {
		(useTaskStore as unknown as jest.Mock).mockImplementation(
			(selector?: (state: any) => any) => {
				const state = {
					toggle: mockToggle,
					remove: mockRemove,
					update: mockUpdate,
					recentlyAddedId: "test-1",
					clearRecentlyAdded: mockClearRecentlyAdded,
					tasks: [],
				};

				if (selector) {
					return selector(state);
				}

				return state;
			},
		);

		const { getByTestId } = render(<TaskCard task={mockTask} />);

		const container = getByTestId("task-card");
		// Check if style array contains recently added styles
		const styles = container.props.style;
		expect(styles).toContainEqual(
			expect.objectContaining({
				borderWidth: 2,
				borderColor: "#28a745",
			}),
		);
	});

	it("clears recently added highlight after 3 seconds", () => {
		(useTaskStore as unknown as jest.Mock).mockImplementation(
			(selector?: (state: any) => any) => {
				const state = {
					toggle: mockToggle,
					remove: mockRemove,
					update: mockUpdate,
					recentlyAddedId: "test-1",
					clearRecentlyAdded: mockClearRecentlyAdded,
					tasks: [],
				};

				if (selector) {
					return selector(state);
				}

				return state;
			},
		);

		render(<TaskCard task={mockTask} />);

		expect(mockClearRecentlyAdded).not.toHaveBeenCalled();

		jest.advanceTimersByTime(3000);

		expect(mockClearRecentlyAdded).toHaveBeenCalledTimes(1);
	});

	it("renders completed task with strikethrough", () => {
		const completedTask = { ...mockTask, completed: true };
		const { getByText } = render(<TaskCard task={completedTask} />);

		const title = getByText("Test Task");
		// Check if style includes strikethrough
		const styles = Array.isArray(title.props.style)
			? title.props.style
			: [title.props.style];
		const hasStrikethrough = styles.some(
			(style) => style && style.textDecorationLine === "line-through",
		);
		expect(hasStrikethrough).toBe(true);
	});

	it("shows image thumbnail when image is present", () => {
		const taskWithImage = {
			...mockTask,
			imageUri: "data:image/png;base64,test",
		};
		const { getByTestId } = render(<TaskCard task={taskWithImage} />);

		// Image preview button should be visible
		const imageButton = getByTestId("image-preview");
		expect(imageButton).toBeTruthy();
	});

	it("opens location picker when location button is pressed", () => {
		const { getByTestId, getByText } = render(<TaskCard task={mockTask} />);

		const locationButton = getByTestId("location-button");
		fireEvent.press(locationButton);

		// Location picker should be visible
		expect(getByText("Choose Location")).toBeTruthy();
	});
});
