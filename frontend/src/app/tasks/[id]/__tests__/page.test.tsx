import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { tasksAPI } from "@/lib/api";
import TaskDetailPage from "../page";

jest.mock("next/navigation", () => ({
	useParams: jest.fn(),
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
	tasksAPI: {
		getTask: jest.fn(),
		snoozeTask: jest.fn(),
		updateTask: jest.fn(),
	},
}));

const mockTask = {
	id: 1,
	title: "Test Task",
	description: "Test Description",
	priority: "high" as const,
	completed: false,
	status: "active" as const,
	source: "manual" as const,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	user_id: "test-user",
	image_url: "/test-image.jpg",
	content: {
		type: "how_to_guide" as const,
		markdown: "# How to Guide\nStep 1: Do this\nStep 2: Do that",
		images: [{ url: "/guide-image.jpg", caption: "Step 1" }],
	},
};

describe("TaskDetailPage", () => {
	const mockPush = jest.fn();
	const mockBack = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useParams as jest.Mock).mockReturnValue({ id: "1" });
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			back: mockBack,
		});
		(useSearchParams as jest.Mock).mockReturnValue({
			get: jest.fn().mockReturnValue(null),
		});
	});

	it("shows loading state initially", () => {
		(tasksAPI.getTask as jest.Mock).mockImplementation(
			() => new Promise(() => {}),
		);

		render(<TaskDetailPage />);

		// Check for the loading spinner instead of text
		const spinner = document.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("shows error state when task fetch fails", async () => {
		(tasksAPI.getTask as jest.Mock).mockRejectedValue(
			new Error("Failed to load"),
		);

		render(<TaskDetailPage />);

		await waitFor(() => {
			expect(screen.getByText("Failed to load task")).toBeInTheDocument();
		});
	});

	it("displays task details when loaded", async () => {
		(tasksAPI.getTask as jest.Mock).mockResolvedValue(mockTask);

		render(<TaskDetailPage />);

		await waitFor(() => {
			expect(screen.getByText("Test Task")).toBeInTheDocument();
			expect(screen.getByText("Test Description")).toBeInTheDocument();
			// Status is not displayed as plain text in the UI
		});
	});

	it("shows initial data from URL params immediately", async () => {
		const mockSearchParams = new URLSearchParams({
			title: "Quick Task",
			description: "Quick Description",
			imageUrl: "/quick-image.jpg",
			status: "active",
		});

		(useSearchParams as jest.Mock).mockReturnValue({
			get: (key: string) => mockSearchParams.get(key),
		});

		(tasksAPI.getTask as jest.Mock).mockImplementation(
			() => new Promise(() => {}),
		);

		render(<TaskDetailPage />);

		// The title should be shown immediately
		expect(screen.getByText("Quick Task")).toBeInTheDocument();

		// Check that the description paragraph exists
		const descriptionParagraph = screen.getByText("Quick Description", {
			selector: "p",
		});
		expect(descriptionParagraph).toBeInTheDocument();
		expect(descriptionParagraph).toHaveClass("text-gray-600");
	});

	it("displays guide content when available", async () => {
		(tasksAPI.getTask as jest.Mock).mockResolvedValue(mockTask);

		render(<TaskDetailPage />);

		await waitFor(() => {
			expect(screen.getByText("Guide")).toBeInTheDocument();
		});

		const guideTab = screen.getByText("Guide");
		expect(guideTab).toBeInTheDocument();
	});

	it("extracts shopping list from description when no explicit list", async () => {
		const taskWithShoppingList = {
			...mockTask,
			description: "- Milk\n- Eggs - 2 dozen\n- Bread",
			content: null,
		};

		(tasksAPI.getTask as jest.Mock).mockResolvedValue(taskWithShoppingList);

		render(<TaskDetailPage />);

		await waitFor(() => {
			expect(screen.getByText("Shopping List")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Shopping List"));

		expect(screen.getByText("Milk")).toBeInTheDocument();
		expect(screen.getByText("Eggs")).toBeInTheDocument();
		expect(screen.getByText("2 dozen")).toBeInTheDocument();
		expect(screen.getByText("Bread")).toBeInTheDocument();
	});

	it("handles snooze action", async () => {
		(tasksAPI.getTask as jest.Mock).mockResolvedValue(mockTask);
		(tasksAPI.snoozeTask as jest.Mock).mockResolvedValue({
			...mockTask,
			status: "snoozed",
		});

		render(<TaskDetailPage />);

		// Wait for task to load first
		await waitFor(() => {
			expect(screen.getByText("Test Task")).toBeInTheDocument();
		});

		// Find the snooze button (it might just have an icon)
		const buttons = screen.getAllByRole("button");
		const snoozeButton = buttons.find(
			(button) =>
				button.textContent?.includes("Snooze") ||
				button.querySelector('[class*="clock"]') !== null,
		);
		expect(snoozeButton).toBeDefined();
		if (snoozeButton) {
			fireEvent.click(snoozeButton);
		}

		await waitFor(() => {
			expect(tasksAPI.snoozeTask).toHaveBeenCalledWith(1, "tomorrow");
		});
	});

	it("handles complete action", async () => {
		(tasksAPI.getTask as jest.Mock).mockResolvedValue(mockTask);
		(tasksAPI.updateTask as jest.Mock).mockResolvedValue({
			...mockTask,
			completed: true,
			status: "completed",
		});

		render(<TaskDetailPage />);

		// Wait for task to load first
		await waitFor(() => {
			expect(screen.getByText("Test Task")).toBeInTheDocument();
		});

		// Find and click the Mark as Done button
		const markAsDoneButton = screen.getByText("Mark as Done");
		fireEvent.click(markAsDoneButton);

		await waitFor(() => {
			expect(tasksAPI.updateTask).toHaveBeenCalledWith(1, {
				completed: true,
				status: "completed",
			});
		});
	});

	it("navigates back when back button is clicked", async () => {
		(tasksAPI.getTask as jest.Mock).mockResolvedValue(mockTask);

		render(<TaskDetailPage />);

		await waitFor(() => {
			expect(screen.getByText("Test Task")).toBeInTheDocument();
		});

		// Find the back button by its role and click it
		const backButton = screen.getAllByRole("button")[0]; // First button is the back button
		fireEvent.click(backButton);

		expect(mockBack).toHaveBeenCalled();
	});
});
