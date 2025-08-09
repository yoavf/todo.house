"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence } from "framer-motion";
import {
	BoxIcon,
	HammerIcon,
	HomeIcon,
	LightbulbIcon,
	type LucideIcon,
	TreesIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTaskContext } from "@/contexts/TaskContext";
import { useTasks } from "@/hooks/useTasks";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import type { Task, TaskType } from "@/lib/api";
import {
	categorizeSnoozedTasks,
	shouldShowAsSingleList,
} from "@/lib/taskCategorization";
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
	const status: "do-next" | "later" =
		task.status === "snoozed" ? "later" : "do-next";

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
	const pathname = usePathname();

	// Determine active tab based on URL
	const activeTab: "do-next" | "later" | "all" =
		pathname === "/later" ? "later" : pathname === "/tasks" ? "all" : "do-next";

	const { tasks, loading, error, refetch } = useTasks();
	const { setRefetchHandler } = useTaskContext();
	const [localTasks, setLocalTasks] = useState<typeof tasks>([]);

	// Add scroll restoration for the window scroll (default behavior)
	useScrollRestoration(undefined, {
		key: `task-list-${activeTab}`,
		saveOnRouteChange: true,
		restoreOnMount: true,
	});

	useEffect(() => {
		setRefetchHandler(refetch);
		return () => setRefetchHandler(null);
	}, [refetch, setRefetchHandler]);

	// Sync local tasks with fetched tasks
	useEffect(() => {
		setLocalTasks(tasks);
	}, [tasks]);

	// Map backend tasks to UI format
	const uiTasks = localTasks.map(mapTaskToUI);
	const filteredTasks = uiTasks.filter(
		(task) => activeTab === "all" || task.status === activeTab,
	);

	const handleTaskRemoval = (taskId: number) => {
		// Remove task from local state immediately
		setLocalTasks((prev) => prev.filter((t) => t.id !== taskId));
	};

	// Helper function to render a section of tasks
	const renderTaskSection = (tasks: Task[], title?: string) => {
		if (tasks.length === 0) return null;

		const uiTasks = tasks.map(mapTaskToUI);
		const content = (
			<AnimatePresence mode="popLayout">
				{uiTasks.map((task) => (
					<TaskItem
						key={task.id}
						task={task}
						onTaskUpdate={() => handleTaskRemoval(task.id)}
						activeTab={activeTab}
					/>
				))}
			</AnimatePresence>
		);

		if (!title) return content;

		return (
			<div>
				<h3 className="text-base font-semibold text-gray-500 mb-3">{title}</h3>
				<div className="space-y-4">{content}</div>
			</div>
		);
	};

	// Function to render time-organized tasks for "later" tab
	const renderTimeOrganizedTasks = () => {
		const categorized = categorizeSnoozedTasks(localTasks);
		const showAsSingleList = shouldShowAsSingleList(categorized);

		if (showAsSingleList) {
			// Show as single list without section headers
			return renderTaskSection(categorized.later);
		}

		// Show with section headers
		return (
			<div className="space-y-8">
				{renderTaskSection(categorized.thisWeek, "This week")}
				{renderTaskSection(categorized.nextWeek, "Next week")}
				{renderTaskSection(categorized.later, "Later")}
			</div>
		);
	};

	return (
		<div
			className="task-list space-y-4 pb-20 scroll-smooth"
			data-testid="task-list"
		>
			{loading ? (
				<div className="flex justify-center items-center py-12">
					<div
						className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"
						data-testid="loading-spinner"
					></div>
				</div>
			) : error ? (
				<div className="text-center py-8">
					<p className="text-red-500 mb-2">Failed to load tasks</p>
					<p className="text-sm text-gray-500">{error}</p>
				</div>
			) : (
				<>
					{activeTab === "later" ? (
						// Time-organized view for "later" tab
						<>
							{renderTimeOrganizedTasks()}
							{localTasks.filter((task) => task.status === "snoozed").length ===
								0 && (
								<div className="text-center py-8">
									<p className="text-gray-500">No tasks in this category</p>
								</div>
							)}
						</>
					) : (
						// Regular list view for other tabs
						<>
							<AnimatePresence mode="popLayout">
								{filteredTasks.map((task) => (
									<TaskItem
										key={task.id}
										task={task}
										onTaskUpdate={() => handleTaskRemoval(task.id)}
										activeTab={activeTab}
									/>
								))}
							</AnimatePresence>

							{filteredTasks.length === 0 && (
								<div className="text-center py-8">
									<p className="text-gray-500">No tasks in this category</p>
								</div>
							)}
						</>
					)}

					<hr className="my-4 border-gray-200" />
					<div className="text-left">
						<Link
							href="/tasks"
							className="text-sm text-gray-500 hover:text-orange-500"
						>
							All tasks &gt;
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
