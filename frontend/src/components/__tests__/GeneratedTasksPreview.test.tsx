import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImageAnalysisResponse } from "@/lib/api";
import { tasksAPI } from "@/lib/api";
import { GeneratedTasksPreview } from "../GeneratedTasksPreview";

jest.mock("@/lib/api", () => ({
	tasksAPI: {
		createTask: jest.fn(),
	},
}));

describe("GeneratedTasksPreview", () => {
	const mockAnalysisResponse: ImageAnalysisResponse = {
		image_id: "test-image-id",
		tasks: [
			{
				title: "Fix leaky faucet",
				description: "Kitchen faucet is dripping",
				priority: "high",
				category: "repair",
				confidence_score: 0.9,
				task_types: ["interior", "plumbing", "repair"],
			},
			{
				title: "Replace HVAC filter",
				description: "Filter appears dirty",
				priority: "medium",
				category: "maintenance",
				confidence_score: 0.85,
				task_types: ["interior", "maintenance", "appliances"],
			},
			{
				title: "Clean gutters",
				description: "Leaves visible in gutters",
				priority: "low",
				category: "maintenance",
				confidence_score: 0.7,
				task_types: ["exterior", "maintenance"],
			},
		],
		analysis_summary: "Found 3 maintenance tasks",
		processing_time: 2.5,
		provider_used: "gemini",
		image_metadata: {},
		retry_count: 0,
	};

	const mockOnTasksCreated = jest.fn();
	const mockOnError = jest.fn();
	const mockOnClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders all generated tasks with task types", () => {
		render(
			<GeneratedTasksPreview
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		// Check first task
		expect(screen.getByText("Fix leaky faucet")).toBeInTheDocument();
		expect(screen.getByText("Kitchen faucet is dripping")).toBeInTheDocument();
		expect(screen.getByText("high")).toBeInTheDocument();

		// Check task types are displayed (some may appear multiple times)
		const interiorBadges = screen.getAllByText("interior");
		expect(interiorBadges.length).toBeGreaterThanOrEqual(2); // At least 2 tasks have "interior"
		expect(screen.getByText("plumbing")).toBeInTheDocument();

		const repairBadges = screen.getAllByText("repair");
		expect(repairBadges.length).toBeGreaterThanOrEqual(1);

		// Check second task
		expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
		const maintenanceBadges = screen.getAllByText("maintenance");
		expect(maintenanceBadges.length).toBeGreaterThanOrEqual(2); // At least 2 tasks have "maintenance"
		expect(screen.getByText("appliances")).toBeInTheDocument();

		// Check third task
		expect(screen.getByText("Clean gutters")).toBeInTheDocument();
		expect(screen.getByText("exterior")).toBeInTheDocument();
	});

	it("displays confidence scores for each task", () => {
		render(
			<GeneratedTasksPreview
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		expect(screen.getByText("Confidence: 90%")).toBeInTheDocument();
		expect(screen.getByText("Confidence: 85%")).toBeInTheDocument();
		expect(screen.getByText("Confidence: 70%")).toBeInTheDocument();
	});

	it("creates tasks with task types when create button is clicked", async () => {
		(tasksAPI.createTask as jest.Mock).mockResolvedValue({});

		render(
			<GeneratedTasksPreview
				analysisResponse={mockAnalysisResponse}
				onTasksCreated={mockOnTasksCreated}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		const createButton = screen.getByText("Create 3 Tasks");
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(tasksAPI.createTask).toHaveBeenCalledTimes(3);
		});

		// Check that first task was created with task types
		expect(tasksAPI.createTask).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Fix leaky faucet",
				description: "Kitchen faucet is dripping",
				priority: "high",
				task_types: ["interior", "plumbing", "repair"],
				source: "ai_generated",
				source_image_id: "test-image-id",
				ai_confidence: 0.9,
				ai_provider: "gemini",
			}),
		);

		// Check that second task was created with task types
		expect(tasksAPI.createTask).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Replace HVAC filter",
				task_types: ["interior", "maintenance", "appliances"],
			}),
		);

		expect(mockOnTasksCreated).toHaveBeenCalledWith(3);
	});

	it("handles tasks without task types gracefully", () => {
		const responseWithoutTypes = {
			...mockAnalysisResponse,
			tasks: [
				{
					title: "Test task",
					description: "Test description",
					priority: "medium" as const,
					category: "test",
					confidence_score: 0.5,
					// No task_types property
				},
			],
		};

		render(
			<GeneratedTasksPreview
				analysisResponse={responseWithoutTypes}
				onTasksCreated={mockOnTasksCreated}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		expect(screen.getByText("Test task")).toBeInTheDocument();
		// Should not show any task type badges
		expect(screen.queryByText("interior")).not.toBeInTheDocument();
		expect(screen.queryByText("exterior")).not.toBeInTheDocument();
	});
});
