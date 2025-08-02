"use client";

import { AlertTriangle, CheckCircle, Clock, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { type ImageMetadata, type Task, tasksAPI } from "@/lib/api";
import { type TaskDetail, taskDetails } from "@/lib/mock-data";
import { TaskDetailModal } from "./task-detail-modal";

interface TaskDetailViewProps {
	task: Task | null;
	isOpen: boolean;
	onClose: () => void;
	onComplete?: (taskId: number) => void;
}

export function TaskDetailView({
	task,
	isOpen,
	onClose,
	onComplete,
}: TaskDetailViewProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	// Use the modal for desktop
	if (isDesktop) {
		return (
			<TaskDetailModal
				task={task}
				isOpen={isOpen}
				onClose={onClose}
				onComplete={onComplete}
			/>
		);
	}

	// Use drawer for mobile
	return (
		<TaskDetailDrawer
			task={task}
			isOpen={isOpen}
			onClose={onClose}
			onComplete={onComplete}
		/>
	);
}

// Mobile Drawer Component
function TaskDetailDrawer({
	task,
	isOpen,
	onClose,
	onComplete,
}: TaskDetailViewProps) {
	const [_sourceImage, setSourceImage] = useState<ImageMetadata | null>(null);
	const [_imageLoading, setImageLoading] = useState(false);

	useEffect(() => {
		const fetchSourceImage = async () => {
			if (task?.source === "ai_generated" && task.source_image_id) {
				try {
					setImageLoading(true);
					const image = await tasksAPI.getImage(task.source_image_id);
					setSourceImage(image);
				} catch (error) {
					console.error("Failed to fetch source image:", error);
				} finally {
					setImageLoading(false);
				}
			}
		};

		if (isOpen && task) {
			fetchSourceImage();
		} else {
			setSourceImage(null);
		}
	}, [task, isOpen, task?.source, task?.source_image_id]);

	if (!task) return null;

	const getTaskDetailKey = (task: Task): string => {
		const title = task.title.toLowerCase();
		if (title.includes("filter") || title.includes("air"))
			return "replace-air-filters";
		if (title.includes("smoke") || title.includes("detector"))
			return "check-smoke-detectors";
		if (title.includes("gutter")) return "clean-gutters";
		return "replace-air-filters";
	};

	const taskDetail: TaskDetail | undefined =
		taskDetails[getTaskDetailKey(task)];

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "easy":
				return "bg-green-100 text-green-700";
			case "medium":
				return "bg-yellow-100 text-yellow-700";
			case "hard":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "essential":
				return "bg-red-100 text-red-700";
			case "recommended":
				return "bg-yellow-100 text-yellow-700";
			case "optional":
				return "bg-gray-100 text-gray-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent className="max-h-[90vh] p-0">
				<DrawerHeader className="px-4 pt-4 pb-2">
					<div className="flex items-start justify-between">
						<div className="flex-1 pr-2">
							<DrawerTitle className="text-xl">{task.title}</DrawerTitle>
							{task.description && (
								<p className="text-gray-600 text-sm mt-1">{task.description}</p>
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
						</div>
					</div>
				</DrawerHeader>

				<div className="px-4 pb-4">
					{!task.completed && (
						<Button
							className="w-full mt-3"
							onClick={() => onComplete?.(task.id)}
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Complete Task
						</Button>
					)}
				</div>

				{taskDetail && (
					<Tabs defaultValue="how-to" className="flex-1">
						<TabsList className="grid w-full grid-cols-4 px-4">
							<TabsTrigger value="how-to">How-To</TabsTrigger>
							<TabsTrigger value="shopping">Shop</TabsTrigger>
							<TabsTrigger value="tips">Tips</TabsTrigger>
							<TabsTrigger value="safety">Safety</TabsTrigger>
						</TabsList>

						<div className="px-4 pb-4">
							<TabsContent value="how-to" className="mt-4 space-y-4">
								{taskDetail.howTos.map((howTo, index) => (
									<Card key={`howto-${index}`}>
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg">{howTo.title}</CardTitle>
												<div className="flex gap-2">
													<Badge
														className={getDifficultyColor(howTo.difficulty)}
														variant="secondary"
													>
														{howTo.difficulty}
													</Badge>
												</div>
											</div>
											<p className="text-sm text-gray-500 flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{howTo.estimatedTime}
											</p>
										</CardHeader>
										<CardContent>
											<ol className="space-y-2">
												{howTo.steps.map((step, stepIndex) => (
													<li
														key={`step-${stepIndex}`}
														className="flex gap-2 text-sm"
													>
														<span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
															{stepIndex + 1}
														</span>
														<span className="text-gray-700">{step}</span>
													</li>
												))}
											</ol>
										</CardContent>
									</Card>
								))}
							</TabsContent>

							<TabsContent value="shopping" className="mt-4">
								<Card>
									<CardContent className="pt-4">
										<div className="space-y-3">
											{taskDetail.shoppingList.map((item, index) => (
												<div
													key={`shopping-${index}`}
													className="flex items-start justify-between p-3 border rounded-lg"
												>
													<div className="flex-1">
														<h4 className="font-medium text-sm">{item.item}</h4>
														<p className="text-xs text-gray-600">
															{item.category}
														</p>
													</div>
													<div className="text-right ml-3">
														<span className="font-medium text-green-600 text-sm">
															{item.estimatedCost}
														</span>
														<Badge
															className={`${getPriorityColor(item.priority)} ml-2`}
															variant="secondary"
														>
															{item.priority}
														</Badge>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="tips" className="mt-4">
								<Card>
									<CardContent className="pt-4">
										<ul className="space-y-2">
											{taskDetail.tips.map((tip, index) => (
												<li key={`tip-${index}`} className="flex gap-2 text-sm">
													<Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
													<span className="text-gray-700">{tip}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="safety" className="mt-4">
								<Card className="border-orange-200 bg-orange-50">
									<CardContent className="pt-4">
										<ul className="space-y-2">
											{taskDetail.safetyNotes.map((note, index) => (
												<li
													key={`safety-${index}`}
													className="flex gap-2 text-sm"
												>
													<AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
													<span className="text-orange-800">{note}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</TabsContent>
						</div>
					</Tabs>
				)}
			</DrawerContent>
		</Drawer>
	);
}
