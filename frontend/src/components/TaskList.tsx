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
							<svg
								className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
								fill="currentColor"
								viewBox="0 0 20 20"
								aria-label="Error"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
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
							<svg
								className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
								fill="currentColor"
								viewBox="0 0 20 20"
								aria-label="Success"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
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
						<svg
							className="w-6 h-6 mr-2 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="Add"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create Task Manually
					</h2>
					<TaskForm onSubmit={handleCreate} />
				</div>

				{/* Tasks List */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
					<h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
						<svg
							className="w-6 h-6 mr-2 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="Task list"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						Your Tasks
					</h2>
					<div className="space-y-3">
						{tasks.length === 0 ? (
							<div className="text-center py-12">
								<svg
									className="w-16 h-16 mx-auto text-gray-300 mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="Empty task list"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
									/>
								</svg>
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
