"use client";

import { format } from "date-fns";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Image as ImageIcon,
	Lightbulb,
	List,
	ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ImageMetadata, type Task, tasksAPI } from "@/lib/api";
import { type TaskDetail, taskDetails } from "@/lib/mock-data";

interface TaskDetailModalProps {
	task: Task | null;
	isOpen: boolean;
	onClose: () => void;
	onComplete?: (taskId: number) => void;
}

export function TaskDetailModal({
	task,
	isOpen,
	onClose,
	onComplete,
}: TaskDetailModalProps) {
	const [sourceImage, setSourceImage] = useState<ImageMetadata | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

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

	// For demo purposes, use a simple mapping to match tasks to details
	const getTaskDetailKey = (task: Task): string => {
		const title = task.title.toLowerCase();
		if (title.includes("filter") || title.includes("air"))
			return "replace-air-filters";
		if (title.includes("smoke") || title.includes("detector"))
			return "check-smoke-detectors";
		if (title.includes("gutter")) return "clean-gutters";
		return "replace-air-filters"; // Default fallback
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
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-2xl sm:!max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<DialogTitle className="text-2xl mb-2">{task.title}</DialogTitle>
							{task.description && (
								<p className="text-gray-600 text-base">{task.description}</p>
							)}
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
								{task.source === "ai_generated" && (
									<Badge
										variant="secondary"
										className="bg-blue-100 text-blue-700"
									>
										AI Generated
									</Badge>
								)}
								{task.completed && (
									<Badge
										variant="secondary"
										className="bg-green-100 text-green-700"
									>
										Completed
									</Badge>
								)}
							</div>
							<p className="text-sm text-gray-500 mt-2">
								Created: {format(new Date(task.created_at), "MMM d, yyyy")}
								{task.ai_confidence && (
									<span className="ml-3">
										AI Confidence: {Math.round(task.ai_confidence * 100)}%
									</span>
								)}
							</p>

							{/* Source Image Preview */}
							{task.source === "ai_generated" && sourceImage && (
								<div className="mt-4">
									<p className="text-sm text-gray-500 mb-2">
										Generated from image:
									</p>
									<div className="relative w-32 h-24 rounded-lg overflow-hidden border">
										<Image
											src={sourceImage.url}
											alt="Source image"
											fill
											className="object-cover"
										/>
									</div>
								</div>
							)}

							{task.source === "ai_generated" && imageLoading && (
								<div className="mt-4">
									<p className="text-sm text-gray-500 mb-2">
										Loading source image...
									</p>
									<div className="w-32 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
								</div>
							)}
						</div>
						{!task.completed && (
							<Button className="ml-4" onClick={() => onComplete?.(task.id)}>
								<CheckCircle className="h-4 w-4 mr-2" />
								Complete Task
							</Button>
						)}
					</div>
				</DialogHeader>

				{taskDetail ? (
					<Tabs defaultValue="how-to" className="mt-6">
						<TabsList
							className={`grid w-full ${task.source === "ai_generated" && sourceImage ? "grid-cols-5" : "grid-cols-4"}`}
						>
							<TabsTrigger value="how-to">How-To</TabsTrigger>
							<TabsTrigger value="shopping">Shopping</TabsTrigger>
							<TabsTrigger value="tips">Tips</TabsTrigger>
							<TabsTrigger value="safety">Safety</TabsTrigger>
							{task.source === "ai_generated" && sourceImage && (
								<TabsTrigger value="source">Source</TabsTrigger>
							)}
						</TabsList>

						<TabsContent value="how-to" className="mt-6">
							<div className="space-y-6">
								{taskDetail.howTos.map((howTo, index) => (
									<Card key={`howto-${index}`}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<CardTitle className="text-xl">{howTo.title}</CardTitle>
												<div className="flex gap-2">
													<Badge
														className={getDifficultyColor(howTo.difficulty)}
													>
														{howTo.difficulty}
													</Badge>
													<Badge
														variant="outline"
														className="flex items-center gap-1"
													>
														<Clock className="h-3 w-3" />
														{howTo.estimatedTime}
													</Badge>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<h4 className="font-medium flex items-center gap-2">
													<List className="h-4 w-4" />
													Steps
												</h4>
												<ol className="space-y-3">
													{howTo.steps.map((step, stepIndex) => (
														<li
															key={`step-${stepIndex}`}
															className="flex gap-3"
														>
															<span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
																{stepIndex + 1}
															</span>
															<span className="text-gray-700">{step}</span>
														</li>
													))}
												</ol>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</TabsContent>

						<TabsContent value="shopping" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShoppingCart className="h-5 w-5" />
										Shopping List
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{taskDetail.shoppingList.map((item, index) => (
											<div
												key={`shopping-${index}`}
												className="flex items-start justify-between p-3 border rounded-lg"
											>
												<div className="flex-1">
													<h4 className="font-medium">{item.item}</h4>
													<p className="text-sm text-gray-600">
														{item.category}
													</p>
												</div>
												<div className="flex items-center gap-3 ml-4">
													<span className="font-medium text-green-600">
														{item.estimatedCost}
													</span>
													<Badge className={getPriorityColor(item.priority)}>
														{item.priority}
													</Badge>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="tips" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Lightbulb className="h-5 w-5" />
										Pro Tips
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3">
										{taskDetail.tips.map((tip, index) => (
											<li key={`tip-${index}`} className="flex gap-3">
												<Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
												<span className="text-gray-700">{tip}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="safety" className="mt-6">
							<Card className="border-orange-200 bg-orange-50">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-orange-800">
										<AlertTriangle className="h-5 w-5" />
										Safety Notes
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3">
										{taskDetail.safetyNotes.map((note, index) => (
											<li key={`safety-${index}`} className="flex gap-3">
												<AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
												<span className="text-orange-800">{note}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						</TabsContent>

						{task.source === "ai_generated" && sourceImage && (
							<TabsContent value="source" className="mt-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<ImageIcon className="h-5 w-5" />
											Source Image
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex justify-center">
												<div className="relative w-full max-w-2xl h-96">
													<Image
														src={sourceImage.url}
														alt="Source image used to generate this task"
														fill
														className="object-contain rounded-lg border shadow-sm"
													/>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-gray-500">Filename</p>
													<p className="font-medium">{sourceImage.filename}</p>
												</div>
												<div>
													<p className="text-gray-500">Uploaded</p>
													<p className="font-medium">
														{format(
															new Date(sourceImage.created_at),
															"MMM d, yyyy",
														)}
													</p>
												</div>
												<div>
													<p className="text-gray-500">File Size</p>
													<p className="font-medium">
														{(sourceImage.file_size / 1024).toFixed(1)} KB
													</p>
												</div>
												<div>
													<p className="text-gray-500">Analysis Status</p>
													<p className="font-medium capitalize">
														{sourceImage.analysis_status}
													</p>
												</div>
											</div>

											{task.ai_provider && (
												<div className="p-3 bg-blue-50 rounded-lg">
													<p className="text-sm text-blue-800">
														<strong>AI Provider:</strong> {task.ai_provider}
														{task.ai_confidence && (
															<span className="ml-2">
																| <strong>Confidence:</strong>{" "}
																{Math.round(task.ai_confidence * 100)}%
															</span>
														)}
													</p>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						)}
					</Tabs>
				) : (
					<div className="mt-6 text-center py-8">
						<p className="text-gray-500">
							No detailed information available for this task.
						</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
