"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ImageMetadata, Task, TaskUpdate } from "@/lib/api";
import { tasksAPI } from "@/lib/api";
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
	const [imageData, setImageData] = useState<ImageMetadata | null>(null);
	const [imageLoading, setImageLoading] = useState(false);
	const [imageError, setImageError] = useState(false);

	useEffect(() => {
		if (task.source === "ai_generated" && task.source_image_id) {
			setImageLoading(true);
			tasksAPI
				.getImage(task.source_image_id)
				.then((data) => {
					setImageData(data);
					setImageError(false);
				})
				.catch((err) => {
					console.error("Failed to load image:", err);
					setImageError(true);
				})
				.finally(() => {
					setImageLoading(false);
				});
		}
	}, [task.source, task.source_image_id]);

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
			<Card className="bg-blue-50 border-2 border-blue-200">
				<CardContent className="space-y-3">
					<Input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="px-4 py-3 h-12 rounded-xl bg-white"
						placeholder="Enter task title"
					/>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="px-4 py-3 rounded-xl resize-none bg-white"
						placeholder="Task description (optional)"
						rows={2}
					/>
				</CardContent>
				<CardFooter className="justify-end gap-3">
					<Button
						type="button"
						onClick={handleCancel}
						variant="outline"
						className="px-4 py-2 rounded-xl font-medium"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
					>
						Save
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card
			className={`transition-all hover:shadow-md group ${
				task.completed ? "border-gray-200 bg-gray-50" : "border-gray-300"
			}`}
		>
			<CardContent>
				<div className="flex items-start gap-4">
					<Checkbox
						checked={task.completed}
						onCheckedChange={toggleCompleted}
						className="mt-0.5 w-6 h-6 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 data-[state=checked]:border-blue-600"
					/>
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
						{task.source === "ai_generated" && (
							<div className="flex items-center gap-2 mt-2">
								<Icons.camera className="w-4 h-4 text-blue-500" />
								<span className="text-xs text-blue-600 font-medium">
									AI Generated
								</span>
								{task.ai_confidence && (
									<span className="text-xs text-gray-500">
										({Math.round(task.ai_confidence * 100)}% confidence)
									</span>
								)}
							</div>
						)}
					</div>
					<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							type="button"
							onClick={() => setIsEditing(true)}
							variant="ghost"
							size="icon"
							className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
							aria-label="Edit task"
						>
							<Icons.edit className="w-5 h-5" />
						</Button>
						<Button
							type="button"
							onClick={() => onDelete(task.id)}
							variant="ghost"
							size="icon"
							className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							aria-label="Delete task"
						>
							<Icons.delete className="w-5 h-5" />
						</Button>
					</div>
				</div>
				{/* Show image thumbnail for AI-generated tasks */}
				{task.source === "ai_generated" && task.source_image_id && (
					<div className="mt-3">
						{imageLoading && (
							<div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
								<Icons.loader className="w-6 h-6 text-gray-400 animate-spin" />
							</div>
						)}
						{imageError && (
							<div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
								<Icons.imageOff className="w-6 h-6 text-gray-400" />
							</div>
						)}
						{imageData && !imageError && (
							<button
								type="button"
								className="w-full h-24 relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
								onClick={() => window.open(imageData.url, "_blank")}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										window.open(imageData.url, "_blank");
									}
								}}
								aria-label={`View source image for task: ${task.title}`}
							>
								<Image
									src={imageData.thumbnail_url}
									alt={`Source image for task: ${task.title}. ${task.description || ""}`}
									fill
									style={{ objectFit: "cover" }}
								/>
							</button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
