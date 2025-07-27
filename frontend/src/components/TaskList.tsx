"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type Task,
	type TaskCreate,
	type TaskUpdate,
	tasksAPI,
} from "@/lib/api";
import { ImageAnalyzer } from "./ImageAnalyzer";
import { TaskForm } from "./TaskForm";
import { TaskItem } from "./TaskItem";

export function TaskList() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);

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

	if (loading) {
		return <div className="text-center py-8">Loading tasks...</div>;
	}

	return (
		<div className="max-w-3xl mx-auto p-4 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">My Tasks</h1>
				<button
					type="button"
					onClick={() => setShowImageAnalyzer(!showImageAnalyzer)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					{showImageAnalyzer ? "Hide Image Analysis" : "Analyze Image"}
				</button>
			</div>

			{error && (
				<div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
			)}

			{showImageAnalyzer ? (
				<ImageAnalyzer />
			) : (
				<TaskForm onSubmit={handleCreate} />
			)}

			<div className="space-y-2">
				{tasks.length === 0 ? (
					<p className="text-gray-500 text-center py-8">
						No tasks yet. Create your first task above!
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
	);
}
