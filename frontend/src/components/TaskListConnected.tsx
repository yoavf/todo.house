"use client";

import {
	BoxIcon,
	HammerIcon,
	HomeIcon,
	LightbulbIcon,
	type LucideIcon,
	TreesIcon,
	WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskType } from "@/lib/api";
import { TaskItem } from "./TaskItem";

// Map task types to icons
const taskTypeIcons: Record<TaskType, LucideIcon> = {
	interior: HomeIcon,
	exterior: TreesIcon,
	electricity: LightbulbIcon,
	plumbing: WrenchIcon,
	appliances: BoxIcon,
	maintenance: HammerIcon,
	repair: WrenchIcon,
};

// Map task types to categories for display
const taskTypeCategories: Record<TaskType, string> = {
	interior: "Interior",
	exterior: "Outdoor",
	electricity: "Electrical",
	plumbing: "Plumbing",
	appliances: "Appliances",
	maintenance: "Maintenance",
	repair: "Repair",
};

function mapTaskToUI(task: Task) {
	// Get the first task type or default to maintenance
	const taskType = task.task_types?.[0] || "maintenance";
	const Icon = taskTypeIcons[taskType] || BoxIcon;
	const category = taskTypeCategories[taskType] || "General";

	// Calculate time ago
	const createdDate = new Date(task.created_at);
	const now = new Date();
	const diffMs = now.getTime() - createdDate.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	let addedTime = "Just now";
	if (diffDays > 0) {
		addedTime = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
	} else if (diffHours > 0) {
		addedTime = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	}

	// Map status
	let status: "do-next" | "later" | "suggested" = "do-next";
	if (task.source === "ai_generated" && !task.completed) {
		status = "suggested";
	} else if (task.status === "snoozed") {
		status = "later";
	} else if (!task.completed) {
		status = "do-next";
	}

	return {
		id: task.id,
		title: task.title,
		description: task.description || "",
		category,
		icon: Icon,
		addedTime,
		estimatedTime: "30m", // Default estimate
		status,
		originalTask: task, // Keep reference to original with source_image_id
	};
}

export function TaskListConnected() {
	const [activeTab, setActiveTab] = useState<
		"do-next" | "later" | "suggested" | "all"
	>("do-next");
	const { tasks, loading, error, updateTask } = useTasks();

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500 mb-2">Failed to load tasks</p>
				<p className="text-sm text-gray-500">{error}</p>
			</div>
		);
	}

	// Map backend tasks to UI format
	const uiTasks = tasks.map(mapTaskToUI);
	const filteredTasks = uiTasks.filter(
		(task) => activeTab === "all" || task.status === activeTab,
	);

	const handleTaskAction = async (taskId: number) => {
		// Mark task as completed
		await updateTask(taskId, { completed: true, status: "completed" });
	};

	const _handleSnooze = async (taskId: number, duration: string) => {
		let snoozedUntil: Date;
		const now = new Date();

		switch (duration) {
			case "Later":
				snoozedUntil = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
				break;
			case "+1w":
				snoozedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
				break;
			case "Wknd":
				// Next weekend (Saturday)
				snoozedUntil = new Date(now);
				snoozedUntil.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
				if (snoozedUntil <= now) {
					snoozedUntil.setDate(snoozedUntil.getDate() + 7);
				}
				break;
			default:
				snoozedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
		}

		await updateTask(taskId, {
			status: "snoozed",
			snoozed_until: snoozedUntil.toISOString(),
		});
	};

	return (
		<div>
			<div className="flex mb-4 border-b border-gray-200">
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${
						activeTab === "do-next"
							? "text-orange-500 border-b-2 border-orange-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
					onClick={() => setActiveTab("do-next")}
				>
					Do next
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${
						activeTab === "later"
							? "text-orange-500 border-b-2 border-orange-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
					onClick={() => setActiveTab("later")}
				>
					Later
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${
						activeTab === "suggested"
							? "text-orange-500 border-b-2 border-orange-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
					onClick={() => setActiveTab("suggested")}
				>
					Suggested
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${
						activeTab === "all"
							? "text-orange-500 border-b-2 border-orange-500"
							: "text-gray-500 hover:text-gray-700"
					}`}
					onClick={() => setActiveTab("all")}
				>
					All
				</button>
			</div>

			<div className="space-y-4">
				{filteredTasks.map((task) => (
					<div
						key={task.id}
						role="button"
						tabIndex={0}
						onClick={() => handleTaskAction(task.id)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleTaskAction(task.id);
							}
						}}
					>
						<TaskItem task={task} />
					</div>
				))}

				{filteredTasks.length === 0 && (
					<div className="text-center py-8">
						<p className="text-gray-500">No tasks in this category</p>
					</div>
				)}

				<hr className="my-4 border-gray-200" />
				<div className="text-left">
					<a
						href="/tasks"
						className="text-sm text-gray-500 hover:text-orange-500"
					>
						All tasks &gt;
					</a>
				</div>
			</div>
		</div>
	);
}
