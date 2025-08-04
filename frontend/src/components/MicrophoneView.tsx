import { LoaderIcon, MicIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SpeechResults } from "./SpeechResults";

export interface MicrophoneViewProps {
	isOpen: boolean;
	onClose: () => void;
	onTaskCreated?: () => void;
}

export function MicrophoneView({
	isOpen,
	onClose,
	onTaskCreated,
}: MicrophoneViewProps) {
	const [isRecording, setIsRecording] = useState(true);
	const [recordingTime, setRecordingTime] = useState(0);
	const [processingState, setProcessingState] = useState<
		null | "processing" | "results"
	>(null);
	const [recordedText, setRecordedText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const [transcript, setTranscript] = useState("");
	const [isListening, setIsListening] = useState(false);

	// Initialize Web Speech API
	useEffect(() => {
		if (!isOpen) return;

		// Check for browser support
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognition) {
			setError(
				"Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
			);
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onstart = () => {
			setIsListening(true);
			setError(null);
		};

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let finalTranscript = "";
			let _interimTranscript = "";

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					finalTranscript += `${transcript} `;
				} else {
					_interimTranscript += transcript;
				}
			}

			if (finalTranscript) {
				setTranscript((prev) => prev + finalTranscript);
			}
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			console.error("Speech recognition error:", event.error);
			if (event.error === "not-allowed") {
				setError(
					"Microphone access denied. Please allow microphone permissions and try again.",
				);
			} else {
				setError(`Speech recognition error: ${event.error}`);
			}
			setIsListening(false);
		};

		recognition.onend = () => {
			setIsListening(false);
		};

		recognitionRef.current = recognition;

		// Start listening immediately when opened
		try {
			recognition.start();
		} catch (error) {
			console.error("Failed to start recognition:", error);
		}

		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.stop();
				} catch (error) {
					console.error("Error stopping recognition:", error);
				}
			}
		};
	}, [isOpen]);

	// Start recording timer when component mounts
	useEffect(() => {
		if (!isOpen) {
			// Reset state when closed
			setIsRecording(true);
			setRecordingTime(0);
			setProcessingState(null);
			setRecordedText("");
			setTranscript("");
			setError(null);
			setIsListening(false);
			return;
		}

		let interval: NodeJS.Timeout;
		if (isRecording && isOpen) {
			interval = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isRecording, isOpen]);

	// Format recording time as MM:SS
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0");
		const secs = (seconds % 60).toString().padStart(2, "0");
		return `${mins}:${secs}`;
	};

	const handleProcessRecording = () => {
		// Stop recording first
		setIsRecording(false);

		// Stop speech recognition
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop();
		}

		// Use the transcript or show error if empty
		const finalText = transcript.trim();
		if (!finalText) {
			setError("No speech detected. Please try again.");
			return;
		}

		setRecordedText(finalText);
		// Start processing
		setProcessingState("processing");
		// Simulate processing time
		setTimeout(() => {
			setProcessingState("results");
		}, 500);
	};

	if (!isOpen) return null;

	// Show audio processing screen if in processing state
	if (processingState === "processing") {
		return (
			<div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-6">
				<div className="max-w-md w-full flex flex-col items-center text-center">
					{/* Animated loader */}
					<div className="w-16 h-16 mb-6 text-orange-500">
						<LoaderIcon size={64} className="animate-spin" />
					</div>
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Processing your audio
					</h2>
					<p className="text-gray-600">Converting speech to task...</p>
				</div>
			</div>
		);
	}

	// Show results screen if in results state
	if (processingState === "results") {
		return (
			<SpeechResults
				speechText={recordedText}
				onClose={onClose}
				onAddTask={() => {
					onTaskCreated?.();
					onClose();
				}}
			/>
		);
	}

	return (
		<div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
			<div className="relative flex-1 flex flex-col items-center justify-center px-6">
				{/* Close button */}
				<button
					type="button"
					className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full"
					onClick={onClose}
				>
					<XIcon size={24} />
				</button>
				{/* Recording indicator */}
				<div className="relative mb-8">
					{/* Pulsing circles animation */}
					{isRecording && (
						<>
							<div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping-slow"></div>
							<div className="absolute inset-0 -m-4 rounded-full bg-orange-500/10 animate-ping-slower"></div>
							<div className="absolute inset-0 -m-8 rounded-full bg-orange-500/5 animate-ping-slowest"></div>
						</>
					)}
					{/* Microphone icon */}
					<div className="relative w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
						<MicIcon size={32} className="text-white" />
					</div>
					{/* Recording time */}
					<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-orange-500 font-medium">
						{formatTime(recordingTime)}
					</div>
				</div>
				{/* Prompt text */}
				<div className="text-center mb-12">
					<h2 className="text-white text-xl font-medium mb-2">
						{isListening ? "I'm listening..." : "Preparing microphone..."}
					</h2>
					<p className="text-gray-400 max-w-xs">
						Say what needs to be done. Feel free to include when, where, and any
						additional details.
					</p>
					{transcript && (
						<div className="mt-4 p-3 bg-white/10 rounded-lg">
							<p className="text-white text-sm">{transcript}</p>
						</div>
					)}
					{error && (
						<div className="mt-4 p-3 bg-red-500/20 rounded-lg">
							<p className="text-red-200 text-sm">{error}</p>
						</div>
					)}
					{!error && !transcript && (
						<p className="text-gray-500 text-sm mt-4 italic">
							Example: "Clean the gutters before it rains next week"
						</p>
					)}
				</div>
				{/* Action buttons */}
				<div className="flex space-x-4">
					<button
						type="button"
						className="px-6 py-3 bg-gray-800 text-white rounded-full font-medium"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="button"
						className={`px-6 py-3 rounded-full font-medium transition-colors ${
							transcript.trim()
								? "bg-orange-500 text-white hover:bg-orange-600"
								: "bg-gray-600 text-gray-400 cursor-not-allowed"
						}`}
						onClick={handleProcessRecording}
						disabled={!transcript.trim()}
					>
						Process
					</button>
				</div>
			</div>
		</div>
	);
}
