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

	describe("Auto-pause detection", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("should auto-process after 3 seconds of silence when transcript exists", async () => {
			mockTranscript = "Buy groceries";
			render(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Verify initial state
			expect(screen.getByText("Buy groceries")).toBeInTheDocument();
			expect(screen.getByText("Process")).toBeEnabled();

			// Fast-forward time by 3 seconds
			act(() => {
				jest.advanceTimersByTime(3000);
			});

			// Should auto-process and show processing state
			await waitFor(() => {
				expect(screen.getByText("Processing your audio")).toBeInTheDocument();
			});

			// Should stop listening
			expect(mockStopListening).toHaveBeenCalled();
		});

		it("should show auto-pause indicator when transcript exists", () => {
			mockTranscript = "Test task";
			render(<MicrophoneView isOpen onClose={jest.fn()} />);

			expect(screen.getByText("Test task")).toBeInTheDocument();
			expect(
				screen.getByText(/Auto-processing in 3 seconds/),
			).toBeInTheDocument();
		});

		it("should reset auto-pause timer when transcript changes", async () => {
			const { rerender } = render(
				<MicrophoneView isOpen onClose={jest.fn()} />,
			);

			// Set initial transcript
			mockTranscript = "Buy";
			rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Wait 2 seconds (less than auto-pause timeout)
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			// Update transcript (user continues speaking)
			mockTranscript = "Buy groceries";
			rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Wait another 2 seconds (total 4 seconds, but timer should have reset)
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			// Should not have auto-processed yet
			expect(
				screen.queryByText("Processing your audio"),
			).not.toBeInTheDocument();
			expect(mockStopListening).not.toHaveBeenCalled();

			// Now wait the full 3 seconds from the last transcript change
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			// Should auto-process now
			await waitFor(() => {
				expect(screen.getByText("Processing your audio")).toBeInTheDocument();
			});

			expect(mockStopListening).toHaveBeenCalled();
		});

		it("should not auto-process when not recording", () => {
			mockTranscript = "Test task";
			render(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Stop recording manually first
			fireEvent.click(screen.getByText("Process"));

			// Reset mocks for this test
			mockStopListening.mockClear();

			// Set new transcript and rerender to trigger auto-pause logic
			mockTranscript = "New task";

			// Fast-forward time
			act(() => {
				jest.advanceTimersByTime(3000);
			});

			// Should not auto-process because we're no longer recording
			expect(mockStopListening).not.toHaveBeenCalled();
		});

		it("should not auto-process when there's an error", () => {
			render(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Simulate an error state
			mockStartListening.mockRejectedValue(
				new Error("Permission denied: not-allowed"),
			);

			// Set transcript
			mockTranscript = "Test task";

			// Fast-forward time
			act(() => {
				jest.advanceTimersByTime(3000);
			});

			// Should not auto-process because there's an error
			expect(mockStopListening).not.toHaveBeenCalled();
		});

		it("should clear auto-pause timer when component closes", () => {
			mockTranscript = "Test task";
			const { rerender } = render(
				<MicrophoneView isOpen onClose={jest.fn()} />,
			);

			// Verify auto-pause indicator is shown
			expect(
				screen.getByText(/Auto-processing in 3 seconds/),
			).toBeInTheDocument();

			// Close component
			rerender(<MicrophoneView isOpen={false} onClose={jest.fn()} />);

			// Clear the mock to ensure we're testing fresh
			mockStopListening.mockClear();

			// Reopen with new transcript
			mockTranscript = "New task";
			rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Fast-forward time by only 1 second - should not auto-process as timer was reset
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			// Should not have processed yet (timer was cleared and restarted)
			expect(mockStopListening).not.toHaveBeenCalled();

			// Now fast-forward the full 3 seconds to verify the new timer works
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			// Should process now with the new timer
			expect(mockStopListening).toHaveBeenCalledTimes(1);
		});

		it("should clear auto-pause timer when manual process is clicked", () => {
			mockTranscript = "Test task";
			render(<MicrophoneView isOpen onClose={jest.fn()} />);

			// Wait 2 seconds
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			// Click manual process button before auto-pause triggers
			fireEvent.click(screen.getByText("Process"));

			// Should process immediately
			expect(mockStopListening).toHaveBeenCalled();

			// Clear mock for next assertion
			mockStopListening.mockClear();

			// Continue time - should not trigger auto-process again
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			// Should not call stop listening again
			expect(mockStopListening).not.toHaveBeenCalled();
		});
	});
});
