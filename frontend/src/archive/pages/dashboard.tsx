"use client";

import { format } from "date-fns";
import { Calendar, Package, Plus } from "lucide-react";
import Link from "next/link";
import { AddTaskModal } from "@/components/add-task-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTasks } from "@/hooks/useTasks";
import { mockAppliances, upcomingMaintenance } from "@/lib/mock-data";

export default function DashboardPage() {
	const { tasks, loading, error, refetch, updateTask } = useTasks();

	const _completedTasks = tasks.filter((t) => t.completed).length;
	const appliancesWithExpiringWarranty = mockAppliances.filter(
		(a) => a.warrantyUntil.getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000,
	).length;
	const suggestedTasks = tasks.filter(
		(t) => t.source === "ai_generated" && !t.completed,
	);
	const myTasks = tasks.filter((t) => !t.completed);

	const handleCompleteTask = async (taskId: number) => {
		try {
			await updateTask(taskId, { completed: true, status: "completed" });
		} catch (error) {
			console.error("Failed to complete task:", error);
		}
	};

	if (loading) {
		return (
			<div className="p-4 md:p-8">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="h-24 bg-gray-200 rounded"></div>
						<div className="h-24 bg-gray-200 rounded"></div>
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
		<div className="p-4 md:p-8">
			<div className="mb-8 flex items-start justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
					<p className="text-gray-600 mt-1">
						Here's what's happening with your home
					</p>
				</div>
				<div className="flex items-center gap-4">
					<AddTaskModal
						onTaskCreated={refetch}
						trigger={
							<Button
								size="lg"
								className="bg-blue-600 hover:bg-blue-700"
								date-testid="new-task-button"
							>
								<Plus className="h-5 w-5 mr-2" />
								New Task
							</Button>
						}
					/>
					<p className="text-sm text-gray-500 flex items-center gap-1">
						<Calendar className="h-4 w-4" />
						{format(new Date(), "MMMM d, yyyy")}
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-green-100">
								<Package className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<CardDescription>Appliances Tracked</CardDescription>
								<CardTitle className="text-2xl">
									{mockAppliances.length}
								</CardTitle>
							</div>
						</div>
					</CardHeader>
				</Card>

				{appliancesWithExpiringWarranty > 0 && (
					<Card className="border-orange-200 bg-orange-50">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-orange-100">
									<Calendar className="h-5 w-5 text-orange-600" />
								</div>
								<div>
									<CardDescription className="text-orange-700">
										Warranties Expiring Soon
									</CardDescription>
									<CardTitle className="text-2xl text-orange-900">
										{appliancesWithExpiringWarranty}
									</CardTitle>
								</div>
							</div>
						</CardHeader>
					</Card>
				)}
			</div>

			{/* Tasks Section - Side by Side on Desktop */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
				{/* My Tasks - Takes 2 columns on desktop */}
				<div className="lg:col-span-2">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
						<Link href="/tasks">
							<Button variant="ghost" size="sm">
								View All
							</Button>
						</Link>
					</div>
					<div className="space-y-4">
						{myTasks.slice(0, 5).map((task) => (
							<div
								key={task.id}
								className="flex items-start justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow cursor-pointer"
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
									}
								}}
							>
								<div className="flex items-start gap-3 flex-1">
									<div className="p-2 rounded-lg bg-gray-100">
										<Package className="h-4 w-4 text-gray-600" />
									</div>
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">{task.title}</h3>
										{task.description && (
											<p className="text-sm text-gray-600 mt-1">
												{task.description}
											</p>
										)}
										<div className="flex flex-wrap gap-2 mt-2">
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
												{task.priority} priority
											</Badge>
											{task.source === "ai_generated" && (
												<Badge
													variant="secondary"
													className="bg-blue-100 text-blue-700"
												>
													AI Generated
												</Badge>
											)}
										</div>
										<p className="text-xs text-gray-500 mt-2">
											Created:{" "}
											{format(new Date(task.created_at), "MMM d, yyyy")}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									className="ml-4"
									onClick={() => handleCompleteTask(task.id)}
								>
									Complete
								</Button>
							</div>
						))}
					</div>
				</div>

				{/* Suggested Tasks - Takes 1 column on desktop */}
				{suggestedTasks.length > 0 && (
					<div className="lg:col-span-1">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">
								Suggested Tasks
							</h2>
							<Link href="/tasks?filter=suggested">
								<Button variant="ghost" size="sm">
									View All
								</Button>
							</Link>
						</div>
						<div className="space-y-4">
							{suggestedTasks.slice(0, 3).map((task) => (
								<div
									key={task.id}
									className="flex flex-col p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow cursor-pointer"
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
										}
									}}
								>
									<div className="flex items-start gap-3">
										<div className="p-2 rounded-lg bg-gray-100">
											<Package className="h-4 w-4 text-gray-600" />
										</div>
										<div className="flex-1">
											<h3 className="font-medium text-gray-900">
												{task.title}
											</h3>
											<p className="text-sm text-gray-600 mt-1">
												{task.description}
											</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-2 mt-3">
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
											{task.priority} priority
										</Badge>
										<Badge
											variant="secondary"
											className="bg-blue-100 text-blue-700"
										>
											AI Generated
										</Badge>
									</div>
									<Button
										size="sm"
										className="mt-4"
										onClick={() => handleCompleteTask(task.id)}
									>
										Add to My Tasks
									</Button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Upcoming Maintenance & Warranties */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Upcoming Maintenance</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{upcomingMaintenance.map((item) => (
							<div key={item.id} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="text-2xl">{item.icon}</span>
									<span className="font-medium">{item.title}</span>
								</div>
								<span className="text-sm text-gray-500">
									{format(item.date, "MMM d")}
								</span>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Warranties Expiring Soon</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{mockAppliances
							.filter(
								(a) =>
									a.warrantyUntil.getTime() - Date.now() <
									90 * 24 * 60 * 60 * 1000,
							)
							.slice(0, 2)
							.map((appliance) => {
								const daysLeft = Math.floor(
									(appliance.warrantyUntil.getTime() - Date.now()) /
										(24 * 60 * 60 * 1000),
								);
								return (
									<div
										key={appliance.id}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<Package className="h-5 w-5 text-gray-400" />
											<span className="font-medium">{appliance.name}</span>
										</div>
										<span className="text-sm text-orange-600 font-medium">
											{daysLeft} days left
										</span>
									</div>
								);
							})}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
