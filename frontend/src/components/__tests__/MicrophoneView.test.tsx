import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MicrophoneView } from "../MicrophoneView";

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

// Mock SpeechRecognition API
class MockSpeechRecognition {
	continuous = false;
	interimResults = false;
	lang = "";
	onstart: ((this: SpeechRecognition, ev: Event) => void) | null = null;
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null = null;
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
		| null = null;
	onend: ((this: SpeechRecognition, ev: Event) => void) | null = null;

	start() {
		// Simulate successful start
		setTimeout(() => {
			if (this.onstart) {
				this.onstart.call(
					this as unknown as SpeechRecognition,
					new Event("start"),
				);
			}
		}, 10);
	}

	stop() {
		if (this.onend) {
			this.onend.call(this as unknown as SpeechRecognition, new Event("end"));
		}
	}

	abort() {
		this.stop();
	}

	// Helper method to simulate speech recognition result
	simulateResult(transcript: string, isFinal = true) {
		if (this.onresult) {
			const event = {
				resultIndex: 0,
				results: [
					[
						{
							transcript,
							confidence: 0.9,
						},
					],
				],
			} as unknown as SpeechRecognitionEvent;
			Object.defineProperty(event.results[0], "isFinal", {
				value: isFinal,
				writable: true,
			});
			Object.defineProperty(event.results, "length", {
				value: 1,
				writable: true,
			});
			act(() => {
				this.onresult?.call(this as unknown as SpeechRecognition, event);
			});
		}
	}

	// Helper method to simulate error
	simulateError(error: string) {
		if (this.onerror) {
			const event = { error } as unknown as SpeechRecognitionErrorEvent;
			act(() => {
				this.onerror?.call(this as unknown as SpeechRecognition, event);
			});
		}
	}
}

describe("MicrophoneView", () => {
	let mockSpeechRecognition: MockSpeechRecognition;

	beforeEach(() => {
		// Setup SpeechRecognition mock
		mockSpeechRecognition = new MockSpeechRecognition();
		window.SpeechRecognition = jest
			.fn()
			.mockImplementation(
				() => mockSpeechRecognition,
			) as unknown as SpeechRecognitionConstructor;
	});

	afterEach(() => {
		delete window.SpeechRecognition;
		delete window.webkitSpeechRecognition;
		jest.clearAllMocks();
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

	it("should show listening state when speech recognition starts", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText("I'm listening...")).toBeInTheDocument();
		});
	});

	it("should display transcript as user speaks", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Wait for recognition to start
		await waitFor(() => {
			expect(screen.getByText("I'm listening...")).toBeInTheDocument();
		});

		// Simulate speech recognition
		mockSpeechRecognition.simulateResult("Clean the kitchen", true);

		await waitFor(() => {
			expect(screen.getByText("Clean the kitchen")).toBeInTheDocument();
		});
	});

	it("should disable Process button when no transcript", () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		const processButton = screen.getByText("Process");
		expect(processButton).toBeDisabled();
	});

	it("should enable Process button when transcript exists", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Simulate speech recognition
		mockSpeechRecognition.simulateResult("Buy groceries", true);

		await waitFor(() => {
			const processButton = screen.getByText("Process");
			expect(processButton).toBeEnabled();
		});
	});

	it("should show error when microphone access is denied", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Simulate permission denied error
		mockSpeechRecognition.simulateError("not-allowed");

		await waitFor(() => {
			expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
		});
	});

	it("should show error for unsupported browsers", () => {
		// Remove SpeechRecognition support
		delete window.SpeechRecognition;

		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(
			screen.getByText(/Speech recognition is not supported/),
		).toBeInTheDocument();
	});

	it("should fallback to webkitSpeechRecognition", () => {
		delete window.SpeechRecognition;
		window.webkitSpeechRecognition = jest
			.fn()
			.mockImplementation(
				() => mockSpeechRecognition,
			) as unknown as SpeechRecognitionConstructor;

		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		expect(window.webkitSpeechRecognition).toHaveBeenCalled();
	});

	it("should process recording and show results", async () => {
		render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Simulate speech recognition
		mockSpeechRecognition.simulateResult("Water the plants", true);

		await waitFor(() => {
			expect(screen.getByText("Process")).toBeEnabled();
		});

		// Click process button
		fireEvent.click(screen.getByText("Process"));

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
		render(
			<MicrophoneView
				isOpen
				onClose={jest.fn()}
				onTaskCreated={onTaskCreated}
			/>,
		);

		// Simulate speech and process
		mockSpeechRecognition.simulateResult("Fix the door", true);

		await waitFor(() => {
			fireEvent.click(screen.getByText("Process"));
		});

		// Wait for results to show
		await waitFor(() => {
			expect(screen.getByTestId("speech-results")).toBeInTheDocument();
		});

		// Click Add Task in the results
		fireEvent.click(screen.getByText("Add Task"));

		expect(onTaskCreated).toHaveBeenCalled();
	});

	it("should stop recognition when component unmounts", () => {
		const stopSpy = jest.spyOn(mockSpeechRecognition, "stop");

		const { unmount } = render(<MicrophoneView isOpen onClose={jest.fn()} />);

		unmount();

		expect(stopSpy).toHaveBeenCalled();
	});

	it("should reset state when closed and reopened", async () => {
		const { rerender } = render(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Add some transcript
		mockSpeechRecognition.simulateResult("Test task", true);

		await waitFor(() => {
			expect(screen.getByText("Test task")).toBeInTheDocument();
		});

		// Close
		rerender(<MicrophoneView isOpen={false} onClose={jest.fn()} />);

		// Reopen
		rerender(<MicrophoneView isOpen onClose={jest.fn()} />);

		// Should not have previous transcript
		expect(screen.queryByText("Test task")).not.toBeInTheDocument();
		expect(screen.getByText("Process")).toBeDisabled();
	});
});
