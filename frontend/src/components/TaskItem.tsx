"use client";

import { useState } from "react";
import type { Task, TaskUpdate } from "@/lib/api";
import { Icons } from "./icons";

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
			<div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-3">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white"
					placeholder="Task title"
				/>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none bg-white"
					placeholder="Task description"
					rows={2}
				/>
				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={handleCancel}
						className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
					>
						Save Changes
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`p-5 bg-white border-2 rounded-xl transition-all hover:shadow-md group ${
				task.completed ? "border-gray-200 bg-gray-50" : "border-gray-300"
			}`}
		>
			<div className="flex items-start gap-4">
				<label className="relative flex items-center cursor-pointer mt-0.5">
					<input
						type="checkbox"
						checked={task.completed}
						onChange={toggleCompleted}
						className="sr-only peer"
					/>
					<div className="w-6 h-6 border-2 rounded-lg peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 peer-checked:border-blue-600 transition-all border-gray-300 flex items-center justify-center">
						{task.completed && (
							<Icons.check
								className="w-4 h-4 text-white"
								strokeWidth={3}
								aria-label="Check"
							/>
						)}
					</div>
				</label>
				<div className="flex-1 min-w-0">
					<h3
						className={`text-lg font-medium transition-all ${
							task.completed ? "text-gray-500 line-through" : "text-gray-800"
						}`}
					>
						{task.title}
					</h3>
					{task.description && (
						<p
							className={`text-sm mt-1 ${
								task.completed ? "text-gray-400" : "text-gray-600"
							}`}
						>
							{task.description}
						</p>
					)}
				</div>
				<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
						aria-label="Edit task"
					>
						<Icons.edit
							className="w-5 h-5"
							aria-label="Edit task"
						/>
					</button>
					<button
						type="button"
						onClick={() => onDelete(task.id)}
						className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						aria-label="Delete task"
					>
						<Icons.delete
							className="w-5 h-5"
							aria-label="Delete task"
						/>
					</button>
				</div>
			</div>
		</div>
	);
}
