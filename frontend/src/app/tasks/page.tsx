"use client";

import { CheckSquare, Clock, Package, Plus } from "lucide-react";
import { useState } from "react";
import { AddTaskModal } from "@/components/add-task-modal";
import { TaskDetailView } from "@/components/task-detail-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/api";

export default function TasksPage() {
	const { tasks, loading, error, refetch, updateTask } = useTasks();
	const [activeFilter, setActiveFilter] = useState<string>("all");
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);

	const handleCompleteTask = async (taskId: number) => {
		try {
			await updateTask(taskId, { completed: true, status: "completed" });
		} catch (error) {
			console.error("Failed to complete task:", error);
		}
	};

	const filteredTasks = tasks.filter((task) => {
		if (activeFilter === "all") return true;
		if (activeFilter === "completed") return task.completed;
		if (activeFilter === "active") return !task.completed;
		if (activeFilter === "ai_generated") return task.source === "ai_generated";
		if (activeFilter === "manual") return task.source === "manual";
		return true;
	});

	if (loading) {
		return (
			<div className="p-4 md:p-8">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-20 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 md:p-8">
				<div className="text-center py-8">
					<p className="text-red-600 mb-4">Failed to load tasks: {error}</p>
					<Button onClick={refetch}>Try Again</Button>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Your Tasks</h1>
						<p className="text-gray-600 mt-1">
							Manage your home maintenance tasks
						</p>
					</div>
					<div className="hidden md:block">
						<Button variant="ghost" className="text-blue-600">
							View All Tasks →
						</Button>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="flex flex-col md:flex-row gap-4 mb-8">
					<AddTaskModal
						onTaskCreated={refetch}
						trigger={
							<Button className="md:w-auto w-full">
								<Plus className="h-4 w-4 mr-2" />
								Add Task
							</Button>
						}
					/>
				</div>

				{/* Filter Tabs */}
				<Tabs
					value={activeFilter}
					onValueChange={setActiveFilter}
					className="mb-6"
				>
					<TabsList className="w-full justify-start overflow-x-auto">
						<TabsTrigger value="all" className="flex items-center gap-2">
							<CheckSquare className="h-4 w-4" />
							All Tasks ({tasks.length})
						</TabsTrigger>
						<TabsTrigger value="active" className="flex items-center gap-2">
							<CheckSquare className="h-4 w-4" />
							Active ({tasks.filter((t) => !t.completed).length})
						</TabsTrigger>
						<TabsTrigger value="completed" className="flex items-center gap-2">
							<CheckSquare className="h-4 w-4" />
							Completed ({tasks.filter((t) => t.completed).length})
						</TabsTrigger>
						<TabsTrigger
							value="ai_generated"
							className="flex items-center gap-2"
						>
							<Package className="h-4 w-4" />
							AI Generated (
							{tasks.filter((t) => t.source === "ai_generated").length})
						</TabsTrigger>
						<TabsTrigger value="manual" className="flex items-center gap-2">
							<Package className="h-4 w-4" />
							Manual ({tasks.filter((t) => t.source === "manual").length})
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{filteredTasks.length === 0 ? (
					<div className="text-center py-8">
						<Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500">No tasks found</p>
						<AddTaskModal
							onTaskCreated={refetch}
							trigger={
								<Button className="mt-4">
									<Plus className="h-4 w-4 mr-2" />
									Add Your First Task
								</Button>
							}
						/>
					</div>
				) : (
					<>
						{/* Desktop Table View */}
						<div className="hidden md:block">
							<div className="border rounded-lg">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Task</TableHead>
											<TableHead>Priority</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Due</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTasks.map((task) => (
											<TableRow
												key={task.id}
												className={`cursor-pointer hover:bg-gray-50 ${task.completed ? "opacity-60" : ""}`}
												onClick={() => setSelectedTask(task)}
											>
												<TableCell>
													<div className="max-w-md">
														<h3
															className={`font-medium truncate ${task.completed ? "line-through" : ""}`}
														>
															{task.title}
														</h3>
														{task.description && (
															<p className="text-sm text-gray-500 mt-1 line-clamp-1">
																{task.description}
															</p>
														)}
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															task.priority === "high"
																? "destructive"
																: "secondary"
														}
														className={
															task.priority === "high"
																? ""
																: task.priority === "medium"
																	? "bg-yellow-100 text-yellow-700"
																	: "bg-green-100 text-green-700"
														}
													>
														{task.priority}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														{task.source === "ai_generated" && (
															<Badge
																variant="secondary"
																className="bg-blue-100 text-blue-700 text-xs"
															>
																AI Generated
															</Badge>
														)}
														{task.completed && (
															<Badge
																variant="secondary"
																className="bg-green-100 text-green-700 text-xs"
															>
																Completed
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-sm text-gray-500">
														<Clock className="h-3 w-3" />
														<span>
															{task.completed ? "Completed" : "Today"}
														</span>
													</div>
												</TableCell>
												<TableCell>
													{!task.completed && (
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																handleCompleteTask(task.id);
															}}
														>
															Complete
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden space-y-4">
							{filteredTasks.map((task) => (
								<div
									key={task.id}
									className={`p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow cursor-pointer ${
										task.completed ? "opacity-60" : ""
									}`}
									role="button"
									tabIndex={0}
									onClick={() => setSelectedTask(task)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelectedTask(task);
										}
									}}
								>
									<div className="flex items-start justify-between mb-3">
										<h3
											className={`font-medium text-gray-900 ${task.completed ? "line-through" : ""}`}
										>
											{task.title}
										</h3>
										<div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
											<Clock className="h-3 w-3" />
											<span>{task.completed ? "Done" : "Today"}</span>
										</div>
									</div>

									{task.description && (
										<p className="text-sm text-gray-600 mb-3">
											{task.description}
										</p>
									)}

									<div className="flex items-center justify-between">
										<div className="flex flex-wrap gap-2">
											<Badge
												variant="secondary"
												className={
													task.priority === "high"
														? "bg-red-100 text-red-700"
														: task.priority === "medium"
															? "bg-yellow-100 text-yellow-700"
															: "bg-green-100 text-green-700"
												}
											>
												{task.priority}
											</Badge>
											{task.source === "ai_generated" && (
												<Badge
													variant="secondary"
													className="bg-blue-100 text-blue-700"
												>
													AI
												</Badge>
											)}
											{task.completed && (
												<Badge
													variant="secondary"
													className="bg-green-100 text-green-700"
												>
													✓
												</Badge>
											)}
										</div>

										{!task.completed && (
											<Button
												size="sm"
												variant="outline"
												onClick={(e) => {
													e.stopPropagation();
													handleCompleteTask(task.id);
												}}
											>
												Complete
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>

			<TaskDetailView
				task={selectedTask}
				isOpen={!!selectedTask}
				onClose={() => setSelectedTask(null)}
				onComplete={(taskId) => {
					handleCompleteTask(taskId);
					setSelectedTask(null);
				}}
			/>
		</>
	);
}
