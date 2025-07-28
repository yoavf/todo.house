"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type Task,
	type TaskCreate,
	type TaskUpdate,
	type ImageAnalysisResponse,
	tasksAPI,
} from "@/lib/api";
import { TaskForm } from "./TaskForm";
import { TaskItem } from "./TaskItem";
import { ImageUpload } from "./ImageUpload";
import { GeneratedTasksPreview } from "./GeneratedTasksPreview";

export function TaskList() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [analysisResponse, setAnalysisResponse] = useState<ImageAnalysisResponse | null>(null);
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
		setSuccessMessage(`Successfully created ${count} task${count !== 1 ? 's' : ''} from image analysis!`);
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
		return <div className="text-center py-8">Loading tasks...</div>;
	}

	return (
		<div className="max-w-4xl mx-auto p-4 space-y-6">
			<h1 className="text-3xl font-bold">My Tasks</h1>

			{error && (
				<div className="p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
					<span>{error}</span>
					<button 
						type="button"
						onClick={() => setError(null)}
						className="text-red-500 hover:text-red-700 ml-4"
						aria-label="Dismiss error"
					>
						×
					</button>
				</div>
			)}

			{successMessage && (
				<div className="p-4 bg-green-100 text-green-700 rounded-lg flex justify-between items-center">
					<span>{successMessage}</span>
					<button 
						type="button"
						onClick={() => setSuccessMessage(null)}
						className="text-green-500 hover:text-green-700 ml-4"
						aria-label="Dismiss success message"
					>
						×
					</button>
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
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 className="text-xl font-semibold mb-4">Create Task Manually</h2>
				<TaskForm onSubmit={handleCreate} />
			</div>

			{/* Tasks List */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
				<div className="space-y-2">
					{tasks.length === 0 ? (
						<p className="text-gray-500 text-center py-8">
							No tasks yet. Create your first task above or upload an image to generate tasks automatically!
						</p>
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
	);
}
