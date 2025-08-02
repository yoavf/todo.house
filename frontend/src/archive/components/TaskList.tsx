"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type ImageAnalysisResponse,
	type Task,
	type TaskCreate,
	type TaskUpdate,
	tasksAPI,
} from "@/lib/api";
import { GeneratedTasksPreview } from "./GeneratedTasksPreview";
import { ImageUpload } from "./ImageUpload";
import { Icons } from "./icons";
import { TaskForm } from "./TaskForm";
import { TaskItem } from "./TaskItem";

export function TaskList() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const loadTasks = useCallback(async () => {
		try {
			setLoading(true);
			const data = await tasksAPI.getTasks();
			setTasks(data);
			setError(null);
		} catch (err) {
			setError("Failed to load tasks");
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTasks();
	}, [loadTasks]);

	const handleCreate = async (taskData: TaskCreate) => {
		try {
			const newTask = await tasksAPI.createTask(taskData);
			setTasks([...tasks, newTask]);
		} catch (err) {
			setError("Failed to create task");
			console.error(err);
		}
	};

	const handleUpdate = async (id: number, update: TaskUpdate) => {
		try {
			const updatedTask = await tasksAPI.updateTask(id, update);
			setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
		} catch (err) {
			setError("Failed to update task");
			console.error(err);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await tasksAPI.deleteTask(id);
			setTasks(tasks.filter((task) => task.id !== id));
		} catch (err) {
			setError("Failed to delete task");
			console.error(err);
		}
	};

	const handleTasksGenerated = (response: ImageAnalysisResponse) => {
		setAnalysisResponse(response);
		setError(null);
	};

	const handleTasksCreated = (count: number) => {
		setSuccessMessage(
			`Successfully created ${count} task${count !== 1 ? "s" : ""} from image analysis!`,
		);
		setAnalysisResponse(null);
		loadTasks(); // Refresh the task list

		// Clear success message after 5 seconds
		setTimeout(() => setSuccessMessage(null), 5000);
	};

	const handleError = (errorMessage: string) => {
		setError(errorMessage);
		setSuccessMessage(null);
	};

	const handleClosePreview = () => {
		setAnalysisResponse(null);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="text-gray-600 font-medium">Loading tasks...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
				<div className="pt-6">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
						My Tasks
					</h1>
					<p className="text-gray-600 mt-2">Organize your work efficiently</p>
				</div>

				{error && (
					<div className="relative p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl shadow-sm animate-in slide-in-from-top-5">
						<div className="flex items-start">
							<Icons.error
								className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
								aria-label="Error"
							/>
							<div className="flex-1">
								<p className="font-medium">{error}</p>
							</div>
							<button
								type="button"
								onClick={() => setError(null)}
								className="ml-4 text-red-600 hover:text-red-800 font-medium text-lg leading-none"
								aria-label="Dismiss error"
							>
								×
							</button>
						</div>
					</div>
				)}

				{successMessage && (
					<div className="relative p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl shadow-sm animate-in slide-in-from-top-5">
						<div className="flex items-start">
							<Icons.success
								className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
								aria-label="Success"
							/>
							<div className="flex-1">
								<p className="font-medium">{successMessage}</p>
							</div>
							<button
								type="button"
								onClick={() => setSuccessMessage(null)}
								className="ml-4 text-green-600 hover:text-green-800 font-medium text-lg leading-none"
								aria-label="Dismiss success message"
							>
								×
							</button>
						</div>
					</div>
				)}

				{/* Image Upload Section */}
				<ImageUpload
					onTasksGenerated={handleTasksGenerated}
					onError={handleError}
				/>

				{/* Generated Tasks Preview */}
				{analysisResponse && (
					<GeneratedTasksPreview
						analysisResponse={analysisResponse}
						onTasksCreated={handleTasksCreated}
						onError={handleError}
						onClose={handleClosePreview}
					/>
				)}

				{/* Manual Task Creation */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
					<h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
						<Icons.add
							className="w-6 h-6 mr-2 text-blue-600"
							aria-label="Add"
						/>
						Create Task Manually
					</h2>
					<TaskForm onSubmit={handleCreate} />
				</div>

				{/* Tasks List */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
					<h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
						<Icons.clipboard
							className="w-6 h-6 mr-2 text-purple-600"
							aria-label="Task list"
						/>
						Your Tasks
					</h2>
					<div className="space-y-3">
						{tasks.length === 0 ? (
							<div className="text-center py-12">
								<Icons.checkSquare
									className="w-16 h-16 mx-auto text-gray-300 mb-4"
									strokeWidth={1.5}
									aria-label="Empty task list"
								/>
								<p className="text-gray-500 font-medium mb-2">No tasks yet</p>
								<p className="text-gray-400 text-sm">
									Create your first task above or upload an image to generate
									tasks automatically!
								</p>
							</div>
						) : (
							tasks.map((task) => (
								<TaskItem
									key={task.id}
									task={task}
									onUpdate={handleUpdate}
									onDelete={handleDelete}
								/>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
