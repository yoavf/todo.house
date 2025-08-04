import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";

// Mock react-speech-recognition before importing component
let mockTranscript = "";
let mockListening = false;
let mockBrowserSupport = true;
const mockStartListening = jest.fn();
const mockStopListening = jest.fn();
const mockResetTranscript = jest.fn();

jest.mock("react-speech-recognition", () => ({
	__esModule: true,
	default: {
		startListening: jest.fn(),
		stopListening: jest.fn(),
	},
	useSpeechRecognition: () => ({
		transcript: mockTranscript,
		listening: mockListening,
		resetTranscript: mockResetTranscript,
		browserSupportsSpeechRecognition: mockBrowserSupport,
	}),
}));

// Import component after mocking
import { MicrophoneView } from "../MicrophoneView";

// Get references to the mocked functions
const SpeechRecognition = require("react-speech-recognition").default;
SpeechRecognition.startListening = mockStartListening;
SpeechRecognition.stopListening = mockStopListening;

// Mock the SpeechResults component
jest.mock("../SpeechResults", () => ({
	SpeechResults: ({
		speechText,
		onAddTask,
		onClose,
	}: {
		speechText: string;
		onAddTask: (task: { title: string }) => void;
		onClose: () => void;
	}) => (
		<div data-testid="speech-results">
			<p>{speechText}</p>
			<button type="button" onClick={() => onAddTask({ title: speechText })}>
				Add Task
			</button>
			<button type="button" onClick={onClose}>
				Close
			</button>
		</div>
	),
}));

describe("MicrophoneView", () => {
	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();
		mockTranscript = "";
		mockListening = false;
		mockBrowserSupport = true;
		mockStartListening.mockResolvedValue(undefined);
		mockStopListening.mockResolvedValue(undefined);
	});

	it("should not render when isOpen is false", () => {
		const { container } = render(
			<MicrophoneView isOpen={false} onClose={jest.fn()} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("should render microphone interface when isOpen is true", () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(screen.getByText("Preparing microphone...")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
		expect(screen.getByText("Process")).toBeInTheDocument();
	});

	it("should start listening when component opens", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		await waitFor(() => {
			expect(mockStartListening).toHaveBeenCalledWith({
				continuous: true,
				language: "en-US",
			});
		});
	});

	it("should show listening state when speech recognition starts", async () => {
		mockListening = true;
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(screen.getByText("I'm listening...")).toBeInTheDocument();
	});

	it("should display transcript as user speaks", async () => {
		mockTranscript = "Clean the kitchen";
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(screen.getByText("Clean the kitchen")).toBeInTheDocument();
	});

	it("should disable Process button when no transcript", () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		const processButton = screen.getByText("Process");
		expect(processButton).toBeDisabled();
	});

	it("should enable Process button when transcript exists", () => {
		mockTranscript = "Buy groceries";
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		const processButton = screen.getByText("Process");
		expect(processButton).toBeEnabled();
	});

	it("should show error when microphone access is denied", async () => {
		mockStartListening.mockRejectedValue(
			new Error("Permission denied: not-allowed"),
		);

		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
		});
	});

	it("should show error for unsupported browsers", () => {
		mockBrowserSupport = false;

		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(
			screen.getByText(/Speech recognition is not supported/),
		).toBeInTheDocument();
	});

	it("should process recording and show results", async () => {
		mockTranscript = "Water the plants";
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Click process button
		fireEvent.click(screen.getByText("Process"));

		// Should stop listening
		expect(mockStopListening).toHaveBeenCalled();

		// Should show processing state briefly
		expect(screen.getByText("Processing your audio")).toBeInTheDocument();

		// Then show results
		await waitFor(() => {
			expect(screen.getByTestId("speech-results")).toBeInTheDocument();
			expect(screen.getByText("Water the plants")).toBeInTheDocument();
		});
	});

	it("should call onClose when Cancel is clicked", () => {
		const onClose = jest.fn();
		render(<MicrophoneView isOpen onClose={onClose} />);

		fireEvent.click(screen.getByText("Cancel"));
		expect(onClose).toHaveBeenCalled();
	});

	it("should call onTaskCreated when task is added from results", async () => {
		const onTaskCreated = jest.fn();
		mockTranscript = "Fix the door";

		render(
			<MicrophoneView
				isOpen
				onClose={jest.fn()}
				onTaskCreated={onTaskCreated}
			/>,
		);

		// Process the recording
		fireEvent.click(screen.getByText("Process"));

		// Wait for results to show
		await waitFor(() => {
			expect(screen.getByTestId("speech-results")).toBeInTheDocument();
		});

		// Click Add Task in the results
		fireEvent.click(screen.getByText("Add Task"));

		expect(onTaskCreated).toHaveBeenCalled();
	});

	it("should stop recognition when component unmounts", () => {
		const { unmount } = render(<MicrophoneView isOpen onClose={jest.fn()} />);

		unmount();

		expect(mockStopListening).toHaveBeenCalled();
	});

	it("should reset state when closed and reopened", async () => {
		const { rerender } = render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Add some transcript
		mockTranscript = "Test task";
		rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Close
		rerender(<MicrophoneView isOpen={false} onClose={jest.fn()} />);

		// Should reset transcript
		await waitFor(() => {
			expect(mockResetTranscript).toHaveBeenCalled();
		});

		// Reset mock transcript for reopen
		mockTranscript = "";

		// Reopen
		rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Should not have previous transcript
		expect(screen.queryByText("Test task")).not.toBeInTheDocument();
		expect(screen.getByText("Process")).toBeDisabled();
	});

	it("should show recording time", async () => {
		jest.useFakeTimers();
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Advance timer by 5 seconds
		act(() => {
			jest.advanceTimersByTime(5000);
		});

		expect(screen.getByText("00:05")).toBeInTheDocument();

		jest.useRealTimers();
	});
});
