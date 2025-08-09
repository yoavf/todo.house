"use client";

import { CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type ImageAnalysisResponse, tasksAPI } from "@/lib/api";
import { getTaskTypeColor } from "@/lib/utils";

interface GeneratedTasksModalProps {
	isOpen: boolean;
	onClose: () => void;
	analysisResponse: ImageAnalysisResponse | null;
	onTasksCreated: () => void;
	onAddManually?: (imageId: string) => void;
}

export function GeneratedTasksModal({
	isOpen,
	onClose,
	analysisResponse,
	onTasksCreated,
	onAddManually,
}: GeneratedTasksModalProps) {
	const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
	const [isCreating, setIsCreating] = useState(false);
	const t = useTranslations();

	if (!isOpen || !analysisResponse) return null;

	const toggleTask = (index: number) => {
		const newSelected = new Set(selectedTasks);
		if (newSelected.has(index)) {
			newSelected.delete(index);
		} else {
			newSelected.add(index);
		}
		setSelectedTasks(newSelected);
	};

	const selectAll = () => {
		const allIndices = new Set(analysisResponse.tasks.map((_, i) => i));
		setSelectedTasks(allIndices);
	};

	const deselectAll = () => {
		setSelectedTasks(new Set());
	};

	const handleCreateTasks = async () => {
		if (selectedTasks.size === 0) return;

		setIsCreating(true);
		try {
			const tasksToCreate = analysisResponse.tasks.filter((_, index) =>
				selectedTasks.has(index),
			);

			// Create all selected tasks
			const promises = tasksToCreate.map((task) => {
				const taskData = {
					title: task.title,
					description: task.description,
					priority: task.priority,
					source: "ai_generated" as const,
					source_image_id: analysisResponse.image_id || undefined,
					ai_confidence: task.confidence_score,
					ai_provider: analysisResponse.provider_used,
					task_types: task.task_types,
				};
				return tasksAPI.createTask(taskData);
			});

			await Promise.all(promises);
			onTasksCreated();
			onClose();
		} catch (error) {
			console.error("Failed to create tasks:", error);
		} finally {
			setIsCreating(false);
		}
	};

	if (analysisResponse.tasks.length === 0) {
		return (
			<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center">
							<SparklesIcon className="w-6 h-6 text-orange-500 mr-2" />
							<h2 className="text-xl font-semibold">
								{t("tasks.generation.modalTitle")}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-full"
							aria-label="Close"
						>
							<XIcon size={20} />
						</button>
					</div>

					{/* Content */}
					<div className="p-8 text-center">
						<p className="text-lg text-gray-700">
							{t("tasks.generation.noTasksFound")}
						</p>
						<p className="text-sm text-gray-500 mt-2">
							{t("tasks.generation.tryManual")}
						</p>
					</div>

					{/* Footer */}
					<div className="p-4 border-t flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
						>
							{t("common.ok")}
						</button>
						<button
							type="button"
							onClick={() => {
								if (analysisResponse.image_id) {
									onAddManually?.(analysisResponse.image_id);
								}
							}}
							className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
						>
							{t("tasks.actions.addManually")}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<div className="flex items-center">
						<SparklesIcon className="w-6 h-6 text-orange-500 mr-2" />
						<h2 className="text-xl font-semibold">
							{t("tasks.generation.modalTitle")}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full"
						aria-label="Close"
					>
						<XIcon size={20} />
					</button>
				</div>

				{/* Summary */}
				<div className="p-4 bg-orange-50 border-b">
					<p className="text-sm text-gray-700">
						{analysisResponse.analysis_summary}
					</p>
					<div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
						<span>
							{t("tasks.generation.tasksFound", {
								count: analysisResponse.tasks.length,
							})}
						</span>
						<span>•</span>
						<span>
							{t("tasks.generation.processedIn", {
								time: analysisResponse.processing_time.toFixed(2),
							})}
						</span>
					</div>
				</div>

				{/* Selection controls */}
				<div className="flex items-center justify-between p-4 border-b">
					<div className="text-sm text-gray-600">
						{t("tasks.generation.selected", {
							selected: selectedTasks.size,
							total: analysisResponse.tasks.length,
						})}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={selectAll}
							className="text-sm px-3 py-1 text-orange-600 hover:bg-orange-50 rounded"
						>
							{t("common.selectAll")}
						</button>
						<button
							type="button"
							onClick={deselectAll}
							className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-50 rounded"
						>
							{t("common.clearAll")}
						</button>
					</div>
				</div>

				{/* Tasks list */}
				<div className="flex-1 overflow-y-auto p-4">
					<div className="space-y-3">
						{analysisResponse.tasks.map((task, index) => (
							<div
								key={index}
								role="button"
								tabIndex={0}
								className={`border rounded-lg p-4 cursor-pointer transition-all ${
									selectedTasks.has(index)
										? "border-orange-500 bg-orange-50"
										: "border-gray-200 hover:border-gray-300"
								}`}
								onClick={() => toggleTask(index)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										toggleTask(index);
									}
								}}
							>
								<div className="flex items-start">
									<div
										className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 flex items-center justify-center ${
											selectedTasks.has(index)
												? "bg-orange-500 border-orange-500"
												: "border-gray-300"
										}`}
									>
										{selectedTasks.has(index) && (
											<CheckIcon size={14} className="text-white" />
										)}
									</div>

									<div className="flex-1">
										<h3 className="font-medium text-gray-900">{task.title}</h3>
										<p className="text-sm text-gray-600 mt-1">
											{task.description}
										</p>

										<div className="flex items-center gap-2 mt-2">
											<span
												className={`text-xs px-2 py-1 rounded-full ${
													task.priority === "high"
														? "bg-red-100 text-red-700"
														: task.priority === "medium"
															? "bg-yellow-100 text-yellow-700"
															: "bg-green-100 text-green-700"
												}`}
											>
												{task.priority} priority
											</span>

											{task.task_types?.map((type, i) => (
												<span
													key={i}
													className={`text-xs px-2 py-1 rounded-full ${getTaskTypeColor(type)}`}
												>
													{type}
												</span>
											))}

											<span className="text-xs text-gray-500">
												{Math.round(task.confidence_score * 100)}% confidence
											</span>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 border-t flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
					>
						{t("common.cancel")}
					</button>
					<button
						type="button"
						onClick={handleCreateTasks}
						disabled={selectedTasks.size === 0 || isCreating}
						className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					>
						{isCreating ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								{t("common.creating")}
							</>
						) : (
							t("tasks.actions.createTasks", { count: selectedTasks.size })
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
