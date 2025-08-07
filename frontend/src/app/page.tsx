"use client";

import { useCallback, useState } from "react";
import { CameraView } from "@/components/CameraView";
import { FAB } from "@/components/FAB";
import { GeneratedTasksModal } from "@/components/GeneratedTasksModal";
import { Header } from "@/components/Header";
import { MicrophoneView } from "@/components/MicrophoneView";
import NoTasksFoundDialog from "@/components/NoTasksFoundDialog";
import { TabNavigation } from "@/components/TabNavigation";
import { TaskList } from "@/components/TaskList";
import { TypingView } from "@/components/TypingView";
import { TaskProvider, useTaskContext } from "@/contexts/TaskContext";
import type { ImageAnalysisResponse, TaskCreate } from "@/lib/api";
import { tasksAPI } from "@/lib/api";

function HomePageContent() {
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [showGeneratedTasks, setShowGeneratedTasks] = useState(false);
	const [showNoTasksFoundDialog, setShowNoTasksFoundDialog] = useState(false);
	const [showMicrophone, setShowMicrophone] = useState(false);
	const [showTyping, setShowTyping] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [imageIDForManualTask, setImageIDForManualTask] = useState<
		string | undefined
	>(undefined);
	const { triggerRefetch } = useTaskContext();

	const handleTasksGenerated = (response: ImageAnalysisResponse) => {
		if (response.tasks.length === 0) {
			setAnalysisResponse(response);
			setShowNoTasksFoundDialog(true);
		} else {
			setAnalysisResponse(response);
			setShowGeneratedTasks(true);
		}
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
		<div
			className="w-full min-h-screen"
			style={{ backgroundColor: "rgb(240, 240, 243)" }}
		>
			<div
				className="max-w-md mx-auto min-h-screen shadow-sm"
				style={{ backgroundColor: "rgb(249, 250, 251)" }}
			>
				<div className="px-4">
					<div
						className="sticky top-0 z-20 pt-6 pb-4"
						style={{ backgroundColor: "rgb(249, 250, 251)" }}
					>
						<Header />
						<TabNavigation />
					</div>
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
				onClose={() => {
					setShowTyping(false);
					setImageIDForManualTask(undefined);
				}}
				onTaskCreated={handleManualTaskCreated}
				source_image_id={imageIDForManualTask}
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
			<NoTasksFoundDialog
				isOpen={showNoTasksFoundDialog}
				onClose={() => setShowNoTasksFoundDialog(false)}
				onAddManually={() => {
					setShowNoTasksFoundDialog(false);
					setImageIDForManualTask(analysisResponse?.image_id ?? undefined);
					setShowTyping(true);
				}}
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
