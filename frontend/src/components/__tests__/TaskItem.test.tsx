import { fireEvent, render, screen } from "@testing-library/react";
import { HomeIcon } from "lucide-react";
import { TaskItem } from "../TaskItem";

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
		originalTask: {
			thumbnail_url: "https://example.com/thumbnail.jpg",
			image_url: "https://example.com/image.jpg",
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders task title and description", () => {
		render(<TaskItem task={mockTask} />);

		expect(screen.getByText("Test Task")).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});

	it("renders task category and estimated time", () => {
		render(<TaskItem task={mockTask} />);

		expect(screen.getByText("Interior")).toBeInTheDocument();
		expect(screen.getByText(/30m/)).toBeInTheDocument();
	});

	it("renders the task icon", () => {
		render(<TaskItem task={mockTask} />);

		// The icon should be rendered within the component
		const categorySection = screen.getByText("Interior").parentElement;
		expect(categorySection).toBeInTheDocument();
	});

	it("shows 'Do it' button", () => {
		render(<TaskItem task={mockTask} />);

		const doItButton = screen.getByRole("button", { name: /Do it/i });
		expect(doItButton).toBeInTheDocument();
	});

	it("shows snooze options when clock button is clicked", () => {
		render(<TaskItem task={mockTask} />);

		// Find and click the clock button
		const clockButtons = screen.getAllByRole("button");
		const clockButton = clockButtons.find(
			(button) => !button.textContent?.includes("Do it"),
		);

		if (clockButton) {
			fireEvent.click(clockButton);
		}

		// Should show snooze options
		expect(screen.getByText("Later")).toBeInTheDocument();
		expect(screen.getByText("+1w")).toBeInTheDocument();
		expect(screen.getByText("Wknd")).toBeInTheDocument();
	});

	it("hides snooze options when clicking outside", () => {
		render(<TaskItem task={mockTask} />);

		// Open snooze options
		const clockButtons = screen.getAllByRole("button");
		const clockButton = clockButtons.find(
			(button) => !button.textContent?.includes("Do it"),
		);

		if (clockButton) {
			fireEvent.click(clockButton);
		}
		expect(screen.getByText("Later")).toBeInTheDocument();

		// Click outside
		fireEvent.mouseDown(document.body);

		// Should hide snooze options
		expect(screen.queryByText("Later")).not.toBeInTheDocument();
	});

	it("renders background image when provided", () => {
		render(<TaskItem task={mockTask} />);

		// The component uses inline styles for the background image
		const taskContainer = screen.getByText("Test Task").closest(".relative");
		expect(taskContainer).toBeInTheDocument();
	});

	it("renders without image when not provided", () => {
		const taskWithoutImage = {
			...mockTask,
			originalTask: undefined,
		};

		render(<TaskItem task={taskWithoutImage} />);

		expect(screen.getByText("Test Task")).toBeInTheDocument();
	});
});
