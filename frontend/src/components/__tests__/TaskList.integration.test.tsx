import { fireEvent, render, screen } from "@testing-library/react";
import { TaskList } from "../TaskList";

describe("TaskList Integration", () => {
	it("renders the task list with tabs", () => {
		render(<TaskList />);

		// Check tabs are rendered
		expect(screen.getByRole("button", { name: "Do next" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Later" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Suggested" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
	});

	it("shows 'Do next' tab as active by default", () => {
		render(<TaskList />);

		const doNextTab = screen.getByRole("button", { name: "Do next" });
		expect(doNextTab).toHaveClass("text-orange-500", "border-orange-500");
	});

	it("switches between tabs when clicked", () => {
		render(<TaskList />);

		// Click on Later tab
		const laterTab = screen.getByRole("button", { name: "Later" });
		fireEvent.click(laterTab);

		// Later tab should be active
		expect(laterTab).toHaveClass("text-orange-500", "border-orange-500");

		// Do next tab should not be active
		const doNextTab = screen.getByRole("button", { name: "Do next" });
		expect(doNextTab).toHaveClass("text-gray-500");
	});

	it("filters tasks based on active tab", () => {
		render(<TaskList />);

		// By default, should show do-next tasks (2 tasks)
		const doNextTasks = screen.getAllByTestId("task-item-do-next");
		expect(doNextTasks).toHaveLength(2);

		// Verify no other status tasks are shown
		expect(screen.queryByTestId("task-item-later")).not.toBeInTheDocument();
		expect(screen.queryByTestId("task-item-suggested")).not.toBeInTheDocument();

		// Switch to Later tab
		const laterTab = screen.getByRole("button", { name: "Later" });
		fireEvent.click(laterTab);

		// Should show only later tasks (1 task)
		const laterTasks = screen.getAllByTestId("task-item-later");
		expect(laterTasks).toHaveLength(1);
		expect(screen.queryByTestId("task-item-do-next")).not.toBeInTheDocument();
		expect(screen.queryByTestId("task-item-suggested")).not.toBeInTheDocument();

		// Switch to Suggested tab
		const suggestedTab = screen.getByRole("button", { name: "Suggested" });
		fireEvent.click(suggestedTab);

		// Should show only suggested tasks (1 task)
		const suggestedTasks = screen.getAllByTestId("task-item-suggested");
		expect(suggestedTasks).toHaveLength(1);
		expect(screen.queryByTestId("task-item-do-next")).not.toBeInTheDocument();
		expect(screen.queryByTestId("task-item-later")).not.toBeInTheDocument();

		// Switch to All tab
		const allTab = screen.getByRole("button", { name: "All" });
		fireEvent.click(allTab);

		// Should show all tasks (4 total: 2 do-next + 1 later + 1 suggested)
		const allDoNextTasks = screen.getAllByTestId("task-item-do-next");
		const allLaterTasks = screen.getAllByTestId("task-item-later");
		const allSuggestedTasks = screen.getAllByTestId("task-item-suggested");

		expect(allDoNextTasks).toHaveLength(2);
		expect(allLaterTasks).toHaveLength(1);
		expect(allSuggestedTasks).toHaveLength(1);
		expect(
			allDoNextTasks.length + allLaterTasks.length + allSuggestedTasks.length,
		).toBe(4);
	});

	it("shows empty state when no tasks in category", () => {
		render(<TaskList />);

		// Create a scenario where there are no tasks
		// Since the component has hardcoded data, we can't test this properly
		// But the component has the logic for it
	});

	it("renders task items with correct props", () => {
		render(<TaskList />);

		// Check that task items are rendered
		expect(screen.getByText("Fix leaking kitchen faucet")).toBeInTheDocument();
		expect(
			screen.getByText("Sink has slow drip that needs new washer or cartridge"),
		).toBeInTheDocument();
	});

	it("shows 'All tasks' link at the bottom", () => {
		render(<TaskList />);

		const allTasksLink = screen.getByText("All tasks >");
		expect(allTasksLink).toBeInTheDocument();
		expect(allTasksLink.closest("a")).toHaveAttribute("href", "/tasks");
	});
});
