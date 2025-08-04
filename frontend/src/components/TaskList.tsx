"use client";

import { formatDistanceToNow } from "date-fns";
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

	// Calculate time ago using date-fns
	const addedTime = formatDistanceToNow(new Date(task.created_at), {
		addSuffix: true,
	});

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
		thumbnail_url: task.thumbnail_url,
		image_url: task.image_url,
	};
}

export function TaskList() {
	const [activeTab, setActiveTab] = useState<
		"do-next" | "later" | "suggested" | "all"
	>("do-next");
	const { tasks, loading, error, refetch } = useTasks();

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div
					className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"
					data-testid="loading-spinner"
				></div>
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

	return (
		<div className="task-list">
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
					<TaskItem key={task.id} task={task} onTaskUpdate={refetch} />
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
