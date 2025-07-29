"use client";

import { Camera, Clock, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type GeneratedTask, type TaskCreate, tasksAPI } from "@/lib/api";

interface AddTaskModalProps {
	onTaskCreated?: () => void;
	trigger?: React.ReactNode;
}

export function AddTaskModal({ onTaskCreated, trigger }: AddTaskModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<"select" | "manual" | "image">("select");
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
	const [manualTask, setManualTask] = useState<{
		title: string;
		description: string;
		priority: "low" | "medium" | "high";
	}>({
		title: "",
		description: "",
		priority: "medium",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = async (file: File) => {
		try {
			setIsAnalyzing(true);
			const result = await tasksAPI.analyzeImage(file);
			setGeneratedTasks(result.tasks);
			setMode("image");
		} catch (error) {
			console.error("Failed to analyze image:", error);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setMode("image"); // Switch to image mode immediately to show progress
			handleImageUpload(file);
		}
	};

	const handleCreateManualTask = async () => {
		if (!manualTask.title.trim()) return;

		try {
			const taskData: TaskCreate = {
				title: manualTask.title,
				description: manualTask.description || undefined,
				priority: manualTask.priority,
				source: "manual",
			};

			await tasksAPI.createTask(taskData);

			// Reset and close modal
			setIsOpen(false);
			onTaskCreated?.();
		} catch (error) {
			console.error("Failed to create task:", error);
		}
	};

	const handleCreateSelectedTasks = async () => {
		try {
			const tasksToCreate = generatedTasks
				.filter((_, index) => selectedTasks.has(index))
				.map((task) => ({
					title: task.title,
					description: task.description,
					priority: task.priority,
					source: "ai_generated" as const,
				}));

			await Promise.all(tasksToCreate.map((task) => tasksAPI.createTask(task)));

			// Reset and close modal
			setIsOpen(false);
			onTaskCreated?.();
		} catch (error) {
			console.error("Failed to create tasks:", error);
		}
	};

	const toggleTaskSelection = (index: number) => {
		const newSelected = new Set(selectedTasks);
		if (newSelected.has(index)) {
			newSelected.delete(index);
		} else {
			newSelected.add(index);
		}
		setSelectedTasks(newSelected);
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			// Reset state when modal closes
			setMode("select");
			setIsAnalyzing(false);
			setGeneratedTasks([]);
			setSelectedTasks(new Set());
			setManualTask({ title: "", description: "", priority: "medium" });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Add Task
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Add New Task</DialogTitle>
				</DialogHeader>

				{mode === "select" && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
						<Card
							className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
							onClick={() => setMode("manual")}
						>
							<CardContent className="flex flex-col items-center justify-center p-8 text-center">
								<div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
									<Clock className="h-8 w-8 text-blue-600" />
								</div>
								<h3 className="text-lg font-semibold mb-2">
									Enter Task Details
								</h3>
								<p className="text-sm text-gray-600">
									Manually add task information
								</p>
							</CardContent>
						</Card>

						<Card
							className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
							onClick={() => fileInputRef.current?.click()}
						>
							<CardContent className="flex flex-col items-center justify-center p-8 text-center">
								<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
									<Camera className="h-8 w-8 text-green-600" />
								</div>
								<h3 className="text-lg font-semibold mb-2">Upload Image</h3>
								<p className="text-sm text-gray-600">Let AI detect the task</p>
							</CardContent>
						</Card>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							className="hidden"
						/>
					</div>
				)}

				{mode === "manual" && (
					<div className="space-y-4 p-4">
						<div>
							<label className="text-sm font-medium mb-2 block">
								Task Title
							</label>
							<Input
								placeholder="Enter task title..."
								value={manualTask.title}
								onChange={(e) =>
									setManualTask((prev) => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">
								Description (optional)
							</label>
							<Textarea
								placeholder="Enter task description..."
								value={manualTask.description}
								onChange={(e) =>
									setManualTask((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								rows={3}
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">Priority</label>
							<Select
								value={manualTask.priority}
								onValueChange={(value: "low" | "medium" | "high") =>
									setManualTask((prev) => ({ ...prev, priority: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex gap-2 pt-4">
							<Button variant="outline" onClick={() => setMode("select")}>
								Back
							</Button>
							<Button
								onClick={handleCreateManualTask}
								disabled={!manualTask.title.trim()}
							>
								Create Task
							</Button>
						</div>
					</div>
				)}

				{mode === "image" && (
					<div className="p-4">
						{isAnalyzing ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p>Analyzing image...</p>
							</div>
						) : (
							<>
								<div className="mb-4">
									<h3 className="text-lg font-semibold mb-2">Detected Tasks</h3>
									<p className="text-sm text-gray-600">
										Select the tasks you want to add:
									</p>
								</div>

								<div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
									{generatedTasks.map((task, index) => (
										<div
											key={`generated-task-${index}`}
											className={`p-3 border rounded-lg cursor-pointer transition-colors ${
												selectedTasks.has(index)
													? "border-blue-500 bg-blue-50"
													: "border-gray-200 hover:border-gray-300"
											}`}
											role="button"
											tabIndex={0}
											onClick={() => toggleTaskSelection(index)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleTaskSelection(index);
												}
											}}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-medium">{task.title}</h4>
													<p className="text-sm text-gray-600 mt-1">
														{task.description}
													</p>
													<div className="flex gap-2 mt-2">
														<span
															className={`text-xs px-2 py-1 rounded ${
																task.priority === "high"
																	? "bg-red-100 text-red-700"
																	: task.priority === "medium"
																		? "bg-yellow-100 text-yellow-700"
																		: "bg-green-100 text-green-700"
															}`}
														>
															{task.priority} priority
														</span>
														<span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
															{Math.round(task.confidence_score * 100)}%
															confidence
														</span>
													</div>
												</div>
												{selectedTasks.has(index) && (
													<div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
														<div className="w-2 h-2 bg-white rounded-full"></div>
													</div>
												)}
											</div>
										</div>
									))}
								</div>

								<div className="flex gap-2">
									<Button variant="outline" onClick={() => setMode("select")}>
										Back
									</Button>
									<Button
										onClick={handleCreateSelectedTasks}
										disabled={selectedTasks.size === 0}
									>
										Create {selectedTasks.size} Task
										{selectedTasks.size !== 1 ? "s" : ""}
									</Button>
								</div>
							</>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
