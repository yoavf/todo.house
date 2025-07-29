"use client";

import { useCallback, useEffect, useState } from "react";
import { type Task, tasksAPI } from "@/lib/api";

export function useTasks() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTasks = useCallback(async () => {
		try {
			setLoading(true);
			const fetchedTasks = await tasksAPI.getTasks();
			setTasks(fetchedTasks);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch tasks");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	const createTask = async (
		task: Parameters<typeof tasksAPI.createTask>[0],
	) => {
		const newTask = await tasksAPI.createTask(task);
		setTasks((prev) => [newTask, ...prev]);
		return newTask;
	};

	const updateTask = async (
		id: number,
		update: Parameters<typeof tasksAPI.updateTask>[1],
	) => {
		const updatedTask = await tasksAPI.updateTask(id, update);
		setTasks((prev) =>
			prev.map((task) => (task.id === id ? updatedTask : task)),
		);
		return updatedTask;
	};

	const deleteTask = async (id: number) => {
		await tasksAPI.deleteTask(id);
		setTasks((prev) => prev.filter((task) => task.id !== id));
	};

	return {
		tasks,
		loading,
		error,
		refetch: fetchTasks,
		createTask,
		updateTask,
		deleteTask,
	};
}
