"use client";

import { useState } from "react";
import type { TaskCreate } from "@/lib/api";

interface TaskFormProps {
	onSubmit: (task: TaskCreate) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		onSubmit({
			title: title.trim(),
			description: description.trim() || undefined,
		});

		setTitle("");
		setDescription("");
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label
					htmlFor="task-title"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Task Title
				</label>
				<input
					id="task-title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Enter task title"
					className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
					required
				/>
			</div>
			<div>
				<label
					htmlFor="task-description"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Description (optional)
				</label>
				<textarea
					id="task-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Add more details about the task"
					className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
					rows={3}
				/>
			</div>
			<button
				type="submit"
				className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-label="Plus"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				<span>Add Task</span>
			</button>
		</form>
	);
}
