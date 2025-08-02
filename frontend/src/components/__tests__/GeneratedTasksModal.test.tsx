import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImageAnalysisResponse } from "@/lib/api";
import { tasksAPI } from "@/lib/api";
import { GeneratedTasksModal } from "../GeneratedTasksModal";

jest.mock("@/lib/api", () => ({
	tasksAPI: {
		createTask: jest.fn(),
	},
}));

const mockTasksAPI = tasksAPI as jest.Mocked<typeof tasksAPI>;

describe("GeneratedTasksModal", () => {
	const mockOnClose = jest.fn();
	const mockOnTasksCreated = jest.fn();

	const mockAnalysisResponse: ImageAnalysisResponse = {
		image_id: "test-image-id",
		tasks: [
			{
				title: "Task 1",
				description: "Description 1",
				priority: "high",
				confidence_score: 0.9,
				task_types: ["maintenance"],
			},
			{
				title: "Task 2",
				description: "Description 2",
				priority: "medium",
				confidence_score: 0.8,
				task_types: ["repair", "plumbing"],
			},
			{
				title: "Task 3",
				description: "Description 3",
				priority: "low",
				confidence_score: 0.7,
				task_types: ["interior"],
			},
		],
		analysis_summary: "Found 3 tasks in the image",
		processing_time: 2.5,
		provider_used: "test-provider",
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("does not render when not open", () => {
		render(
			<GeneratedTasksModal
				isOpen={false}
				onClose={mockOnClose}
				analysisResponse={null}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.queryByText("AI Generated Tasks")).not.toBeInTheDocument();
	});

	it("does not render when no analysis response", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={null}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.queryByText("AI Generated Tasks")).not.toBeInTheDocument();
	});

	it("renders modal with tasks when open", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.getByText("AI Generated Tasks")).toBeInTheDocument();
		expect(screen.getByText("Task 1")).toBeInTheDocument();
		expect(screen.getByText("Task 2")).toBeInTheDocument();
		expect(screen.getByText("Task 3")).toBeInTheDocument();
	});

	it("displays analysis summary and processing time", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.getByText("Found 3 tasks in the image")).toBeInTheDocument();
		expect(screen.getByText("Found 3 tasks")).toBeInTheDocument();
		expect(screen.getByText("Processed in 2.50s")).toBeInTheDocument();
	});

	it("toggles task selection when clicked", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		const task1 = screen.getByText("Task 1").closest('[role="button"]');
		expect(task1).toHaveClass("border-gray-200");

		// Click to select
		fireEvent.click(task1!);
		expect(task1).toHaveClass("border-orange-500", "bg-orange-50");

		// Click to deselect
		fireEvent.click(task1!);
		expect(task1).toHaveClass("border-gray-200");
	});

	it("handles select all and clear all", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		// Click select all
		fireEvent.click(screen.getByText("Select all"));
		expect(screen.getByText("3 of 3 selected")).toBeInTheDocument();

		// All tasks should be selected
		const tasks = screen
			.getAllByRole("button")
			.filter((el) => el.classList.contains("border-orange-500"));
		expect(tasks).toHaveLength(3);

		// Click clear all
		fireEvent.click(screen.getByText("Clear all"));
		expect(screen.getByText("0 of 3 selected")).toBeInTheDocument();
	});

	it("displays task priorities and confidence scores", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.getByText("high priority")).toBeInTheDocument();
		expect(screen.getByText("medium priority")).toBeInTheDocument();
		expect(screen.getByText("low priority")).toBeInTheDocument();

		expect(screen.getByText("90% confidence")).toBeInTheDocument();
		expect(screen.getByText("80% confidence")).toBeInTheDocument();
		expect(screen.getByText("70% confidence")).toBeInTheDocument();
	});

	it("displays task types", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		expect(screen.getByText("maintenance")).toBeInTheDocument();
		expect(screen.getByText("repair")).toBeInTheDocument();
		expect(screen.getByText("plumbing")).toBeInTheDocument();
		expect(screen.getByText("interior")).toBeInTheDocument();
	});

	it("creates selected tasks when Create button is clicked", async () => {
		mockTasksAPI.createTask.mockResolvedValue({} as any);

		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		// Select first two tasks
		fireEvent.click(screen.getByText("Task 1").closest('[role="button"]')!);
		fireEvent.click(screen.getByText("Task 2").closest('[role="button"]')!);

		// Click create
		fireEvent.click(screen.getByText("Create 2 Tasks"));

		// Should show creating state
		expect(screen.getByText("Creating...")).toBeInTheDocument();

		// Wait for creation to complete
		await waitFor(() => {
			expect(mockTasksAPI.createTask).toHaveBeenCalledTimes(2);
			expect(mockTasksAPI.createTask).toHaveBeenCalledWith({
				title: "Task 1",
				description: "Description 1",
				priority: "high",
				source: "ai_generated",
				source_image_id: "test-image-id",
				ai_confidence: 0.9,
				ai_provider: "test-provider",
				task_types: ["maintenance"],
			});
			expect(mockOnTasksCreated).toHaveBeenCalled();
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	it("disables Create button when no tasks selected", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		const createButton = screen.getByText("Create 0 Tasks");
		expect(createButton).toBeDisabled();
	});

	it("closes modal when Cancel is clicked", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		fireEvent.click(screen.getByText("Cancel"));
		expect(mockOnClose).toHaveBeenCalled();
	});

	it("closes modal when X button is clicked", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);
		expect(mockOnClose).toHaveBeenCalled();
	});

	it("handles keyboard navigation", () => {
		render(
			<GeneratedTasksModal
				isOpen={true}
				onClose={mockOnClose}
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
			/>,
		);

		const task1 = screen.getByText("Task 1").closest('[role="button"]')!;

		// Simulate Enter key
		fireEvent.keyDown(task1, { key: "Enter" });
		expect(task1).toHaveClass("border-orange-500");

		// Simulate Space key
		fireEvent.keyDown(task1, { key: " " });
		expect(task1).toHaveClass("border-gray-200");
	});
});
