import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { imageAPI } from "@/lib/api";
import { ImageAnalyzer } from "../ImageAnalyzer";

// Mock the API module
jest.mock("@/lib/api", () => ({
	imageAPI: {
		analyzeImage: jest.fn(),
	},
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

describe("ImageAnalyzer", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders image upload component initially", () => {
		render(<ImageAnalyzer />);

		expect(screen.getByText("Image Analysis")).toBeInTheDocument();
		expect(
			screen.getByText("Drop an image or click to upload"),
		).toBeInTheDocument();
	});

	it("shows image preview after selecting a file", async () => {
		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");

		await user.upload(input, file);

		expect(screen.getByAltText("Selected file preview")).toBeInTheDocument();
		expect(screen.getByText("test.png")).toBeInTheDocument();
		expect(screen.getByText(/0\.00\s*MB/)).toBeInTheDocument();
		expect(URL.createObjectURL).toHaveBeenCalledWith(file);
	});

	it("shows analyze button after image selection", async () => {
		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");

		await user.upload(input, file);

		expect(screen.getByText("Analyze Image")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
	});

	it("analyzes image and displays results", async () => {
		const mockResult = {
			tasks: [
				{
					title: "Fix leaky faucet",
					description: "The faucet appears to be dripping",
					priority: "high" as const,
					confidence: 0.95,
				},
				{
					title: "Clean bathroom tiles",
					description: "Tiles show signs of mildew",
					priority: "medium" as const,
					confidence: 0.85,
				},
			],
			processing_time: 1.23,
		};

		(imageAPI.analyzeImage as jest.Mock).mockResolvedValue(mockResult);

		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		// Upload file
		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");
		await user.upload(input, file);

		// Click analyze
		const analyzeButton = screen.getByText("Analyze Image");
		await user.click(analyzeButton);

		// The loading state might be too fast to capture in tests, skip checking it

		// Wait for results
		await waitFor(() => {
			expect(screen.getByText("Generated Tasks")).toBeInTheDocument();
		});

		// Check results
		expect(screen.getByText("Fix leaky faucet")).toBeInTheDocument();
		expect(
			screen.getByText("The faucet appears to be dripping"),
		).toBeInTheDocument();
		expect(screen.getByText("Clean bathroom tiles")).toBeInTheDocument();
		expect(screen.getByText("95% confidence")).toBeInTheDocument();
		expect(screen.getByText("85% confidence")).toBeInTheDocument();
		expect(screen.getByText("Processing time: 1.23s")).toBeInTheDocument();
	});

	it("handles analysis errors", async () => {
		(imageAPI.analyzeImage as jest.Mock).mockRejectedValue(
			new Error("Failed to analyze image"),
		);

		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		// Upload file
		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");
		await user.upload(input, file);

		// Click analyze
		const analyzeButton = screen.getByText("Analyze Image");
		await user.click(analyzeButton);

		// Wait for error
		await waitFor(() => {
			expect(screen.getByText("Failed to analyze image")).toBeInTheDocument();
		});
	});

	it("allows clearing the selected image", async () => {
		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		// Upload file
		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");
		await user.upload(input, file);

		// Click clear button
		const clearButton = screen.getByLabelText("Remove image");
		await user.click(clearButton);

		// Should return to upload state
		expect(
			screen.getByText("Drop an image or click to upload"),
		).toBeInTheDocument();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-url");
	});

	it("allows analyzing another image after results", async () => {
		const mockResult = {
			tasks: [
				{
					title: "Test task",
					priority: "low" as const,
					confidence: 0.8,
				},
			],
			processing_time: 0.5,
		};

		(imageAPI.analyzeImage as jest.Mock).mockResolvedValue(mockResult);

		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		// Upload and analyze
		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");
		await user.upload(input, file);
		await user.click(screen.getByText("Analyze Image"));

		// Wait for results
		await waitFor(() => {
			expect(screen.getByText("Generated Tasks")).toBeInTheDocument();
		});

		// Click to analyze another
		await user.click(screen.getByText("Analyze Another Image"));

		// Should return to upload state
		expect(
			screen.getByText("Drop an image or click to upload"),
		).toBeInTheDocument();
	});

	it("displays priority badges with correct colors", async () => {
		const mockResult = {
			tasks: [
				{ title: "High priority", priority: "high" as const, confidence: 0.9 },
				{
					title: "Medium priority",
					priority: "medium" as const,
					confidence: 0.8,
				},
				{ title: "Low priority", priority: "low" as const, confidence: 0.7 },
			],
			processing_time: 1,
		};

		(imageAPI.analyzeImage as jest.Mock).mockResolvedValue(mockResult);

		const user = userEvent.setup();
		render(<ImageAnalyzer />);

		// Upload and analyze
		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");
		await user.upload(input, file);
		await user.click(screen.getByText("Analyze Image"));

		// Wait for results
		await waitFor(() => {
			expect(screen.getByText("Generated Tasks")).toBeInTheDocument();
		});

		// Check priority badges
		const highBadge = screen.getByText("high");
		const mediumBadge = screen.getByText("medium");
		const lowBadge = screen.getByText("low");

		expect(highBadge.className).toContain("bg-red-100");
		expect(highBadge.className).toContain("text-red-700");
		expect(mediumBadge.className).toContain("bg-yellow-100");
		expect(mediumBadge.className).toContain("text-yellow-700");
		expect(lowBadge.className).toContain("bg-green-100");
		expect(lowBadge.className).toContain("text-green-700");
	});
});
