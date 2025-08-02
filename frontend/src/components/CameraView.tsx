import { ImageIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { ImageAnalysisResponse } from "@/lib/api";
import { ImageProcessing } from "./ImageProcessing";
import { SuggestionResults } from "./SuggestionResults";

interface CameraViewProps {
	isOpen: boolean;
	onClose: () => void;
	onTasksGenerated?: (response: ImageAnalysisResponse) => void;
}

export function CameraView({
	isOpen,
	onClose,
	onTasksGenerated,
}: CameraViewProps) {
	const [isCapturing, setIsCapturing] = useState(false);
	const [processingState, setProcessingState] = useState<
		null | "processing" | "results"
	>(null);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

	// Mock image URLs for simulation
	const mockImageUrls = [
		"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
		"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
		"https://images.unsplash.com/photo-1521207418485-99c705420785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
	];

	const handleCapture = () => {
		// Simulate capturing a photo
		setIsCapturing(true);
		setTimeout(() => {
			setIsCapturing(false);
			// Select a random mock image URL
			const randomImage =
				mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
			setCapturedImageUrl(randomImage);
			// Start processing
			setProcessingState("processing");
		}, 300);
	};

	const handleSelectFromDevice = () => {
		// In a real app, this would open the device's file picker
		console.log("Select from device clicked");
		// For simulation, use a mock image and start processing
		const randomImage =
			mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
		setCapturedImageUrl(randomImage);
		setProcessingState("processing");
	};

	const handleProcessingComplete = () => {
		setProcessingState("results");
	};

	const handleAddTasks = (
		tasks: Array<{
			title: string;
			description?: string;
			priority?: string;
			category?: string;
		}>,
	) => {
		// In a real app, this would add the tasks to the user's task list
		console.log("Adding tasks:", tasks);
		// Create a mock response similar to ImageAnalysisResponse
		const mockResponse = {
			image_id: "mock-image-id",
			tasks: tasks.map((task) => ({
				title: task.title,
				description: task.description || "",
				priority: (task.priority || "medium") as "low" | "medium" | "high",
				category: task.category || "general",
				confidence_score: 0.95,
				task_types: [],
			})),
			analysis_summary: "Tasks generated from image",
			processing_time: 2.5,
			provider_used: "mock",
			image_metadata: {},
			retry_count: 0,
		};
		onTasksGenerated?.(mockResponse);
		onClose();
	};

	if (!isOpen) return null;

	// Show processing screen if in processing state
	if (processingState === "processing") {
		return (
			<ImageProcessing
				imageUrl={capturedImageUrl || ""}
				onComplete={handleProcessingComplete}
			/>
		);
	}

	// Show results screen if in results state
	if (processingState === "results") {
		return (
			<SuggestionResults
				imageUrl={capturedImageUrl || ""}
				onClose={onClose}
				onAddTasks={handleAddTasks}
			/>
		);
	}

	// Otherwise show camera view
	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col">
			{/* Camera viewfinder */}
			<div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
				{/* Simulated camera feed */}
				<div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
					<div
						className="absolute inset-0 opacity-10"
						style={{
							backgroundImage:
								"url('https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')",
							backgroundSize: "cover",
							backgroundPosition: "center",
						}}
					></div>
				</div>
				{/* Camera UI elements */}
				<div className="absolute inset-0 pointer-events-none">
					{/* Corner markers to indicate viewfinder */}
					<div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-white opacity-60"></div>
					<div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-white opacity-60"></div>
					<div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-white opacity-60"></div>
					<div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-white opacity-60"></div>
				</div>
				{/* Flash effect when capturing */}
				{isCapturing && (
					<div className="absolute inset-0 bg-white animate-flash"></div>
				)}
				{/* Close button */}
				<button
					type="button"
					className="absolute top-4 right-4 p-4 bg-black/50 text-white rounded-full"
					onClick={onClose}
				>
					<XIcon size={28} />
				</button>
				{/* Capture hint text */}
				<div className="absolute top-4 left-0 right-0 text-center">
					<p className="text-white/70 text-sm">Tap to capture your task</p>
				</div>
			</div>
			{/* Bottom controls */}
			<div className="h-24 bg-black flex items-center justify-center relative">
				{/* Capture button */}
				<button
					type="button"
					className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
					onClick={handleCapture}
				>
					<div className="w-14 h-14 rounded-full bg-white"></div>
				</button>
				{/* Select from device button */}
				<button
					type="button"
					className="absolute right-8 w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white"
					onClick={handleSelectFromDevice}
				>
					<ImageIcon size={20} />
				</button>
			</div>
		</div>
	);
}
