"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TaskCreate } from "@/lib/api";
import { Icons } from "./icons";

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
		<Card className="hover:shadow-xl transition-shadow duration-300">
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<Label htmlFor="task-title" className="mb-1">
							Task Title
						</Label>
						<Input
							id="task-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter task title"
							className="px-4 py-3 h-12 rounded-xl"
							required
						/>
					</div>
					<div>
						<Label htmlFor="task-description" className="mb-1">
							Description (optional)
						</Label>
						<Textarea
							id="task-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Task description (optional)"
							className="px-4 py-3 rounded-xl resize-none"
							rows={3}
						/>
					</div>
					<Button
						type="submit"
						className="w-full px-4 py-3 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
					>
						<Icons.add className="w-5 h-5" />
						<span>Add Task</span>
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
