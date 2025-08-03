"use client";

import { useCallback, useState } from "react";
import { CameraView } from "@/components/CameraView";
import { FAB } from "@/components/FAB";
import { GeneratedTasksModal } from "@/components/GeneratedTasksModal";
import { Header } from "@/components/Header";
import { MicrophoneView } from "@/components/MicrophoneView";
import { TaskList } from "@/components/TaskList";
import { TypingView } from "@/components/TypingView";
import type { ImageAnalysisResponse, TaskCreate } from "@/lib/api";
import { tasksAPI } from "@/lib/api";

export default function HomePage() {
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [showGeneratedTasks, setShowGeneratedTasks] = useState(false);
	const [showMicrophone, setShowMicrophone] = useState(false);
	const [showTyping, setShowTyping] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleTasksGenerated = (response: ImageAnalysisResponse) => {
		setAnalysisResponse(response);
		setShowGeneratedTasks(true);
	};

	const handleTasksCreated = useCallback(() => {
		// Close the modal and trigger a refresh of the task list
		setShowGeneratedTasks(false);
		setAnalysisResponse(null);
		setRefreshKey((prev) => prev + 1); // Force TaskList to refetch
	}, []);

	const handleKeyboardClick = () => {
		setShowTyping(true);
	};

	const handleMicrophoneClick = () => {
		setShowMicrophone(true);
	};

	const handleCameraClick = () => {
		setShowCamera(true);
	};

	const handleManualTaskCreated = async (task: TaskCreate) => {
		try {
			await tasksAPI.createTask(task);
			setRefreshKey((prev) => prev + 1); // Force TaskList to refetch
		} catch (error) {
			console.error("Failed to create task:", error);
		}
	};

	// Check if any full-screen view is open
	const isFullScreenViewOpen = showMicrophone || showTyping || showCamera;

	return (
		<div className="w-full min-h-screen bg-gray-50">
			<div className="max-w-md mx-auto px-4 py-6">
				<Header />
				<TaskList key={refreshKey} />
			</div>

			{!isFullScreenViewOpen && (
				<FAB
					onKeyboardClick={handleKeyboardClick}
					onMicrophoneClick={handleMicrophoneClick}
					onCameraClick={handleCameraClick}
				/>
			)}

			<MicrophoneView
				isOpen={showMicrophone}
				onClose={() => setShowMicrophone(false)}
				onTaskCreated={() => {
					setRefreshKey((prev) => prev + 1);
				}}
			/>

			<TypingView
				isOpen={showTyping}
				onClose={() => setShowTyping(false)}
				onTaskCreated={handleManualTaskCreated}
			/>

			<CameraView
				isOpen={showCamera}
				onClose={() => setShowCamera(false)}
				onTasksGenerated={handleTasksGenerated}
			/>

			<GeneratedTasksModal
				isOpen={showGeneratedTasks}
				onClose={() => setShowGeneratedTasks(false)}
				analysisResponse={analysisResponse}
				onTasksCreated={handleTasksCreated}
			/>
		</div>
	);
}
