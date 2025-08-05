"use client";

import { useCallback, useState } from "react";
import { CameraView } from "@/components/CameraView";
import { FAB } from "@/components/FAB";
import { GeneratedTasksModal } from "@/components/GeneratedTasksModal";
import { Header } from "@/components/Header";
import { MicrophoneView } from "@/components/MicrophoneView";
import { TabNavigation } from "@/components/TabNavigation";
import { TaskList } from "@/components/TaskList";
import { TypingView } from "@/components/TypingView";
import { TaskProvider, useTaskContext } from "@/contexts/TaskContext";
import { useScrollBounce } from "@/hooks/useScrollBounce";
import type { ImageAnalysisResponse, TaskCreate } from "@/lib/api";
import { tasksAPI } from "@/lib/api";

function HomePageContent() {
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [showGeneratedTasks, setShowGeneratedTasks] = useState(false);
	const [showMicrophone, setShowMicrophone] = useState(false);
	const [showTyping, setShowTyping] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const { triggerRefetch } = useTaskContext();

	// Add scroll bounce effect
	const bounceState = useScrollBounce({
		threshold: 5,
		duration: 300,
	});

	const handleTasksGenerated = (response: ImageAnalysisResponse) => {
		setAnalysisResponse(response);
		setShowGeneratedTasks(true);
	};

	const handleTasksCreated = useCallback(() => {
		// Close the modal and trigger a refresh of the task list
		setShowGeneratedTasks(false);
		setAnalysisResponse(null);
		triggerRefetch();
	}, [triggerRefetch]);

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
			triggerRefetch();
		} catch (error) {
			console.error("Failed to create task:", error);
		}
	};

	// Check if any full-screen view is open
	const isFullScreenViewOpen = showMicrophone || showTyping || showCamera;

	return (
		<div className="w-full min-h-screen bg-gray-50">
			<div className="max-w-md mx-auto px-4">
				<div className="sticky top-0 bg-gray-50 z-20 pt-6 pb-4">
					<Header />
					<TabNavigation />
				</div>
				<div
					className="transition-transform duration-300 ease-out"
					style={{
						transform: bounceState.transform,
					}}
				>
					<TaskList />
				</div>
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
					triggerRefetch();
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

export default function HomePage() {
	return (
		<TaskProvider>
			<HomePageContent />
		</TaskProvider>
	);
}
