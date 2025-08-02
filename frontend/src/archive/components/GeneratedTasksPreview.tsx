"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	type ImageAnalysisResponse,
	type TaskCreate,
	tasksAPI,
} from "@/lib/api";
import { getTaskTypeColor } from "@/lib/utils";
import { Icons } from "./icons";

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
					description: task.description,
					priority: task.priority,
					source: "ai_generated",
					source_image_id: analysisResponse.image_id || undefined,
					ai_confidence: task.confidence_score,
					ai_provider: analysisResponse.provider_used,
					task_types: task.task_types,
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
		<Card className="hover:shadow-xl transition-shadow duration-300">
			<CardHeader>
				<CardTitle className="text-2xl font-semibold text-gray-800 flex items-center">
					<Icons.lightbulb
						className="w-6 h-6 mr-2 text-purple-600"
						aria-label="Light bulb"
					/>
					Generated Tasks
				</CardTitle>
				<p className="text-sm text-gray-600 flex items-center flex-wrap gap-3">
					Found {analysisResponse.tasks.length} potential tasks • Processed in{" "}
					{analysisResponse.processing_time.toFixed(2)}s • Provider:{" "}
					{analysisResponse.provider_used}
				</p>
				{onClose && (
					<CardAction>
						<Button
							type="button"
							onClick={onClose}
							variant="ghost"
							size="icon"
							className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
							aria-label="Close preview"
						>
							<Icons.close className="w-5 h-5" aria-label="Close" />
						</Button>
					</CardAction>
				)}
			</CardHeader>

			<CardContent>
				{/* AI Analysis Summary */}
				{analysisResponse.analysis_summary && (
					<Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
						<CardContent>
							<h4 className="font-medium text-blue-900 mb-2 flex items-center">
								<Icons.info className="w-5 h-5 mr-2" aria-label="Information" />
								AI Analysis
							</h4>
							<p className="text-sm text-blue-800 leading-relaxed">
								{analysisResponse.analysis_summary}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Task Selection Controls */}
				<div className="flex justify-between items-center mb-6 px-1">
					<Button
						type="button"
						onClick={handleSelectAll}
						variant="ghost"
						size="sm"
						className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
					>
						<Icons.success className="w-4 h-4" aria-label="Check circle" />
						<span>
							{selectedTasks.size === analysisResponse.tasks.length
								? "Deselect All"
								: "Select All"}
						</span>
					</Button>
					<span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
						{selectedTasks.size} of {analysisResponse.tasks.length} selected
					</span>
				</div>

				{/* Tasks List */}
				<div className="space-y-3 mb-6">
					{analysisResponse.tasks.map((task, index) => (
						<Card
							key={`task-${index}-${task.title}`}
							className={`transition-all hover:shadow-md ${
								selectedTasks.has(index)
									? "border-blue-400 bg-blue-50"
									: "border-gray-200 bg-white hover:border-gray-300"
							}`}
						>
							<CardContent>
								<div className="flex items-start gap-3">
									<Checkbox
										checked={selectedTasks.has(index)}
										onCheckedChange={() => handleTaskToggle(index)}
										className="mt-0.5 w-5 h-5 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 data-[state=checked]:border-blue-600"
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<h4 className="font-semibold text-gray-900 text-lg">
												{task.title}
											</h4>
											<span
												className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}
											>
												{task.priority}
											</span>
											<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
												{task.category}
											</span>
										</div>
										<p className="text-sm text-gray-700 mb-2">
											{task.description}
										</p>
										{task.task_types && task.task_types.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mb-2">
												{task.task_types.map((type) => (
													<Badge
														key={type}
														variant="secondary"
														className={`text-xs px-2 py-0.5 ${getTaskTypeColor(type)}`}
													>
														{type}
													</Badge>
												))}
											</div>
										)}
										<div className="flex items-center gap-4 text-xs text-gray-500">
											<span
												className={`font-medium ${getConfidenceColor(task.confidence_score)}`}
											>
												Confidence: {(task.confidence_score * 100).toFixed(0)}%
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</CardContent>

			{/* Action Buttons */}
			<CardFooter className="gap-3">
				<Button
					type="button"
					onClick={handleCreateTasks}
					disabled={selectedTasks.size === 0 || isCreating}
					className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
				>
					{isCreating ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							<span>Creating Tasks...</span>
						</>
					) : (
						<>
							<Icons.add className="w-5 h-5" aria-label="Plus" />
							<span>
								Create {selectedTasks.size} Task
								{selectedTasks.size !== 1 ? "s" : ""}
							</span>
						</>
					)}
				</Button>
				{onClose && (
					<Button
						type="button"
						onClick={onClose}
						disabled={isCreating}
						variant="outline"
						className="px-6 py-3 rounded-xl font-medium"
					>
						Cancel
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
