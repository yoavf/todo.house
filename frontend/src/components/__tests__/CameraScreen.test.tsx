import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { tasksAPI } from "@/lib/api";
import { CameraScreen } from "../CameraScreen";

jest.mock("@/lib/api", () => ({
	tasksAPI: {
		analyzeImage: jest.fn(),
	},
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, className }: any) => (
		// eslint-disable-next-line @next/next/no-img-element
		<img src={src} alt={alt} className={className} />
	),
}));

const mockTasksAPI = tasksAPI as jest.Mocked<typeof tasksAPI>;

describe("CameraScreen", () => {
	const mockOnClose = jest.fn();
	const mockOnTasksGenerated = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset file input value
		Object.defineProperty(HTMLInputElement.prototype, "files", {
			writable: true,
			value: [],
		});
	});

	it("does not render when not open", () => {
		render(
			<CameraScreen
				isOpen={false}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		expect(screen.queryByText("Capture Home Task")).not.toBeInTheDocument();
	});

	it("renders when open", () => {
		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		expect(screen.getByText("Capture Home Task")).toBeInTheDocument();
		expect(screen.getByText("Take Photo")).toBeInTheDocument();
		expect(screen.getByText("Choose from Gallery")).toBeInTheDocument();
	});

	it("closes when close button is clicked", () => {
		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it("triggers file input when Take Photo is clicked", () => {
		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
		const clickSpy = jest.spyOn(fileInput, "click");

		const takePhotoButton = screen.getByText("Take Photo").closest("button");
		fireEvent.click(takePhotoButton!);

		expect(clickSpy).toHaveBeenCalled();
	});

	it("shows preview when file is selected", async () => {
		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
		const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

		// Mock FileReader
		const mockReadAsDataURL = jest.fn();
		const mockReader = {
			readAsDataURL: mockReadAsDataURL,
			result: "data:image/jpeg;base64,test",
			onloadend: null as any,
		};

		jest
			.spyOn(window, "FileReader")
			.mockImplementation(() => mockReader as any);

		// Trigger file selection
		Object.defineProperty(fileInput, "files", {
			value: [file],
		});
		fireEvent.change(fileInput);

		// Trigger FileReader onloadend
		act(() => {
			mockReader.onloadend?.();
		});

		// Should show preview and analyze button
		await waitFor(() => {
			expect(screen.getByAltText("Selected")).toBeInTheDocument();
			expect(screen.getByText("Analyze")).toBeInTheDocument();
			expect(screen.getByText("Retake")).toBeInTheDocument();
		});
	});

	it("analyzes image when Analyze button is clicked", async () => {
		const mockResponse = {
			image_id: "test-id",
			tasks: [],
			analysis_summary: "Test summary",
			processing_time: 1.5,
			provider_used: "test",
		};

		mockTasksAPI.analyzeImage.mockResolvedValueOnce(mockResponse);

		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		// Set up file and preview
		const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
		const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

		const mockReader = {
			readAsDataURL: jest.fn(),
			result: "data:image/jpeg;base64,test",
			onloadend: null as any,
		};

		jest
			.spyOn(window, "FileReader")
			.mockImplementation(() => mockReader as any);

		Object.defineProperty(fileInput, "files", {
			value: [file],
		});
		fireEvent.change(fileInput);

		// Wrap the FileReader callback in act
		act(() => {
			mockReader.onloadend?.();
		});

		// Click analyze
		const analyzeButton = screen.getByText("Analyze");
		fireEvent.click(analyzeButton);

		// Wait for analyzing state to appear
		await waitFor(() => {
			expect(screen.getByText("Analyzing...")).toBeInTheDocument();
		});

		// Wait for analysis to complete
		await waitFor(() => {
			expect(mockTasksAPI.analyzeImage).toHaveBeenCalledWith(file);
			expect(mockOnTasksGenerated).toHaveBeenCalledWith(mockResponse);
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	it("shows error when analysis fails", async () => {
		mockTasksAPI.analyzeImage.mockRejectedValueOnce(
			new Error("Analysis failed"),
		);

		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		// Set up file and preview
		const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
		const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

		const mockReader = {
			readAsDataURL: jest.fn(),
			result: "data:image/jpeg;base64,test",
			onloadend: null as any,
		};

		jest
			.spyOn(window, "FileReader")
			.mockImplementation(() => mockReader as any);

		Object.defineProperty(fileInput, "files", {
			value: [file],
		});
		fireEvent.change(fileInput);

		// Wrap the FileReader callback in act
		act(() => {
			mockReader.onloadend?.();
		});

		// Click analyze
		await waitFor(() => {
			const analyzeButton = screen.getByText("Analyze");
			fireEvent.click(analyzeButton);
		});

		// Should show error
		await waitFor(() => {
			expect(screen.getByText("Analysis failed")).toBeInTheDocument();
		});
	});

	it("allows retaking photo", async () => {
		render(
			<CameraScreen
				isOpen={true}
				onClose={mockOnClose}
				onTasksGenerated={mockOnTasksGenerated}
			/>,
		);

		// Set up file and preview
		const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
		const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

		const mockReader = {
			readAsDataURL: jest.fn(),
			result: "data:image/jpeg;base64,test",
			onloadend: null as any,
		};

		jest
			.spyOn(window, "FileReader")
			.mockImplementation(() => mockReader as any);

		Object.defineProperty(fileInput, "files", {
			value: [file],
		});
		fireEvent.change(fileInput);

		// Wrap the FileReader callback in act
		act(() => {
			mockReader.onloadend?.();
		});

		// Click retake
		await waitFor(() => {
			const retakeButton = screen.getByText("Retake");
			fireEvent.click(retakeButton);
		});

		// Should go back to initial state
		expect(screen.getByText("Take Photo")).toBeInTheDocument();
		expect(screen.queryByAltText("Selected")).not.toBeInTheDocument();
	});
});
