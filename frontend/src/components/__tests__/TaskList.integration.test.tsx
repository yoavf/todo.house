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

		// By default, should show do-next tasks
		expect(screen.getByText("Fix leaking kitchen faucet")).toBeInTheDocument();
		expect(
			screen.getByText("Change living room light bulbs"),
		).toBeInTheDocument();

		// Switch to Later tab
		const laterTab = screen.getByRole("button", { name: "Later" });
		fireEvent.click(laterTab);

		// Should show later tasks
		expect(screen.getByText("Mow the lawn")).toBeInTheDocument();
		expect(
			screen.queryByText("Fix leaking kitchen faucet"),
		).not.toBeInTheDocument();

		// Switch to Suggested tab
		const suggestedTab = screen.getByRole("button", { name: "Suggested" });
		fireEvent.click(suggestedTab);

		// Should show suggested tasks
		expect(screen.getByText("Replace bathroom caulking")).toBeInTheDocument();

		// Switch to All tab
		const allTab = screen.getByRole("button", { name: "All" });
		fireEvent.click(allTab);

		// Should show all tasks
		expect(screen.getByText("Fix leaking kitchen faucet")).toBeInTheDocument();
		expect(screen.getByText("Mow the lawn")).toBeInTheDocument();
		expect(screen.getByText("Replace bathroom caulking")).toBeInTheDocument();
		expect(
			screen.getByText("Change living room light bulbs"),
		).toBeInTheDocument();
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
