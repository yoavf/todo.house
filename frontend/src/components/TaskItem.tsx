"use client";

import { useState } from "react";
import type { Task, TaskUpdate } from "@/lib/api";

interface TaskItemProps {
	task: Task;
	onUpdate: (id: number, update: TaskUpdate) => void;
	onDelete: (id: number) => void;
}

export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description || "");

	const handleSave = () => {
		onUpdate(task.id, { title, description });
		setIsEditing(false);
	};

	const handleCancel = () => {
		setTitle(task.title);
		setDescription(task.description || "");
		setIsEditing(false);
	};

	const toggleCompleted = () => {
		onUpdate(task.id, { completed: !task.completed });
	};

	if (isEditing) {
		return (
			<div className="p-4 border rounded-lg space-y-2">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-3 py-2 border rounded"
					placeholder="Task title"
				/>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-3 py-2 border rounded"
					placeholder="Task description"
					rows={2}
				/>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleSave}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Save
					</button>
					<button
						type="button"
						onClick={handleCancel}
						className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
					>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 border rounded-lg flex items-start gap-3">
			<input
				type="checkbox"
				checked={task.completed}
				onChange={toggleCompleted}
				className="mt-1"
			/>
			<div className="flex-1">
				<h3
					className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}
				>
					{task.title}
				</h3>
				{task.description && (
					<p className="text-gray-600 text-sm mt-1">{task.description}</p>
				)}
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
				>
					Edit
				</button>
				<button
					type="button"
					onClick={() => onDelete(task.id)}
					className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
				>
					Delete
				</button>
			</div>
		</div>
	);
}
