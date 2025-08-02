"use client";

import { useCallback, useState } from "react";
import { FAB } from "@/components/FAB";
import { GeneratedTasksModal } from "@/components/GeneratedTasksModal";
import { Header } from "@/components/Header";
import { TaskListConnected } from "@/components/TaskListConnected";
import type { ImageAnalysisResponse } from "@/lib/api";

export default function HomePage() {
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [showGeneratedTasks, setShowGeneratedTasks] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleTasksGenerated = (response: ImageAnalysisResponse) => {
		setAnalysisResponse(response);
		setShowGeneratedTasks(true);
	};

	const handleTasksCreated = useCallback(() => {
		// Close the modal and trigger a refresh of the task list
		setShowGeneratedTasks(false);
		setAnalysisResponse(null);
		setRefreshKey((prev) => prev + 1); // Force TaskListConnected to refetch
	}, []);

	return (
		<div className="w-full min-h-screen bg-gray-50">
			<div className="max-w-md mx-auto px-4 py-6">
				<Header />
				<TaskListConnected key={refreshKey} />
			</div>
			<FAB onTasksGenerated={handleTasksGenerated} />

			<GeneratedTasksModal
				isOpen={showGeneratedTasks}
				onClose={() => setShowGeneratedTasks(false)}
				analysisResponse={analysisResponse}
				onTasksCreated={handleTasksCreated}
			/>
		</div>
	);
}
