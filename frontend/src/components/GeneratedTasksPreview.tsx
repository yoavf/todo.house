"use client";

import { useState } from "react";
import {
	type ImageAnalysisResponse,
	type TaskCreate,
	tasksAPI,
} from "@/lib/api";

interface GeneratedTasksPreviewProps {
	analysisResponse: ImageAnalysisResponse;
	onTasksCreated?: (createdTasks: number) => void;
	onError?: (error: string) => void;
	onClose?: () => void;
}

export function GeneratedTasksPreview({
	analysisResponse,
	onTasksCreated,
	onError,
	onClose,
}: GeneratedTasksPreviewProps) {
	const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
		new Set(analysisResponse.tasks.map((_, index) => index)),
	);
	const [isCreating, setIsCreating] = useState(false);

	const handleTaskToggle = (index: number) => {
		const newSelected = new Set(selectedTasks);
		if (newSelected.has(index)) {
			newSelected.delete(index);
		} else {
			newSelected.add(index);
		}
		setSelectedTasks(newSelected);
	};

	const handleSelectAll = () => {
		if (selectedTasks.size === analysisResponse.tasks.length) {
			setSelectedTasks(new Set());
		} else {
			setSelectedTasks(
				new Set(analysisResponse.tasks.map((_, index) => index)),
			);
		}
	};

	const handleCreateTasks = async () => {
		if (selectedTasks.size === 0) {
			onError?.("Please select at least one task to create");
			return;
		}

		setIsCreating(true);
		let createdCount = 0;

		try {
			for (const index of selectedTasks) {
				const task = analysisResponse.tasks[index];
				const taskData: TaskCreate = {
					title: task.title,
					description: `${task.description}\n\n🤖 Generated from image analysis\n📊 Confidence: ${(task.confidence_score * 100).toFixed(0)}%\n🏷️ Category: ${task.category}`,
				};

				await tasksAPI.createTask(taskData);
				createdCount++;
			}

			onTasksCreated?.(createdCount);
			onClose?.();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to create tasks";
			onError?.(errorMessage);
		} finally {
			setIsCreating(false);
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "text-red-600 bg-red-50 border-red-200";
			case "medium":
				return "text-yellow-600 bg-yellow-50 border-yellow-200";
			case "low":
				return "text-green-600 bg-green-50 border-green-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	const getConfidenceColor = (score: number) => {
		if (score >= 0.8) return "text-green-600";
		if (score >= 0.6) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex justify-between items-start mb-4">
				<div>
					<h3 className="text-lg font-semibold">Generated Tasks</h3>
					<p className="text-sm text-gray-600 mt-1">
						Found {analysisResponse.tasks.length} potential tasks • Processed in{" "}
						{analysisResponse.processing_time.toFixed(2)}s • Provider:{" "}
						{analysisResponse.provider_used}
					</p>
				</div>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close preview"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</div>

			{/* AI Analysis Summary */}
			{analysisResponse.analysis_summary && (
				<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
					<p className="text-sm text-blue-800">
						{analysisResponse.analysis_summary}
					</p>
				</div>
			)}

			{/* Task Selection Controls */}
			<div className="flex justify-between items-center mb-4">
				<button
					type="button"
					onClick={handleSelectAll}
					className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
				>
					{selectedTasks.size === analysisResponse.tasks.length
						? "Deselect All"
						: "Select All"}
				</button>
				<span className="text-sm text-gray-600">
					{selectedTasks.size} of {analysisResponse.tasks.length} selected
				</span>
			</div>

			{/* Tasks List */}
			<div className="space-y-3 mb-6">
				{analysisResponse.tasks.map((task, index) => (
					<div
						key={`task-${index}-${task.title}`}
						className={`border rounded-lg p-4 transition-all ${
							selectedTasks.has(index)
								? "border-blue-300 bg-blue-50"
								: "border-gray-200 bg-gray-50"
						}`}
					>
						<div className="flex items-start gap-3">
							<input
								type="checkbox"
								checked={selectedTasks.has(index)}
								onChange={() => handleTaskToggle(index)}
								className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-2">
									<h4 className="font-medium text-gray-900">{task.title}</h4>
									<span
										className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}
									>
										{task.priority}
									</span>
									<span className="text-xs text-gray-500">{task.category}</span>
								</div>
								<p className="text-sm text-gray-700 mb-2">{task.description}</p>
								<div className="flex items-center gap-4 text-xs text-gray-500">
									<span
										className={`font-medium ${getConfidenceColor(task.confidence_score)}`}
									>
										Confidence: {(task.confidence_score * 100).toFixed(0)}%
									</span>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={handleCreateTasks}
					disabled={selectedTasks.size === 0 || isCreating}
					className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{isCreating
						? "Creating Tasks..."
						: `Create ${selectedTasks.size} Task${selectedTasks.size !== 1 ? "s" : ""}`}
				</button>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						disabled={isCreating}
						className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
				)}
			</div>
		</div>
	);
}
