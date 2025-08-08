"use client";

import {
	ArrowLeft,
	Check,
	Clock,
	MapPin,
	Package,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SnoozeModal } from "@/components/SnoozeModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type ShoppingListItem, type Task, tasksAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

function TaskDetailPageInner() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const taskIdParam = params.id as string;
	const taskId = parseInt(taskIdParam);

	// Validate taskId
	const isValidTaskId = !Number.isNaN(taskId) && taskId > 0;

	// Get initial data from URL params
	const initialTitle = searchParams.get("title");
	const initialDescription = searchParams.get("description");
	const initialImageUrl = searchParams.get("imageUrl");
	const initialStatus = searchParams.get("status") as Task["status"] | null;

	const [task, setTask] = useState<Task | null>(() => {
		// Create partial task from URL params if available
		if (initialTitle && isValidTaskId) {
			return {
				id: taskId,
				title: initialTitle,
				description: initialDescription || undefined,
				image_url: initialImageUrl || undefined,
				status: initialStatus || "active",
				// Minimal required fields
				priority: "medium",
				completed: false,
				source: "manual",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user_id: "",
			} as Task;
		}
		return null;
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showSnoozeModal, setShowSnoozeModal] = useState(false);
	const [snoozeError, setSnoozeError] = useState<string | null>(null);
	const t = useTranslations();

	// Use CSS mirroring for RTL instead of conditional icons

	useEffect(() => {
		const loadTask = async () => {
			// Check if taskId is valid before making API call
			if (!isValidTaskId) {
				setError(t("errors.invalidTaskId"));
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const data = await tasksAPI.getTask(taskId);
				setTask(data);
			} catch (err) {
				setError(t("errors.failedToLoadTask"));
				console.error("Error fetching task:", err);
			} finally {
				setLoading(false);
			}
		};
		loadTask();
	}, [taskId, isValidTaskId, t]);

	const handleSnooze = async (date: Date) => {
		if (!task) return;
		setSnoozeError(null);
		try {
			await tasksAPI.updateTask(task.id, {
				status: "snoozed",
				snoozed_until: date.toISOString(),
			});
			setShowSnoozeModal(false);
			// Navigate back after snoozing
			router.back();
		} catch (error) {
			console.error("Error snoozing task:", error);
			setSnoozeError(t("errors.failedToSnoozeTask"));
		}
	};

	const handleSnoozeClick = () => {
		setShowSnoozeModal(true);
	};

	const handleComplete = async () => {
		if (!task) return;
		try {
			const updatedTask = await tasksAPI.updateTask(task.id, {
				completed: true,
				status: "completed",
			});
			setTask(updatedTask);
			// Navigate back after completing
			router.back();
		} catch (err) {
			console.error("Error completing task:", err);
		}
	};

	if (loading && !task) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
				</div>
			</div>
		);
	}

	if (error && !task) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<p className="text-red-500 mb-4">{error}</p>
					<Button onClick={() => router.back()} variant="outline">
						<ArrowLeft className="w-4 h-4 me-2 rtl:scale-x-[-1]" />
						{t("common.goBack")}
					</Button>
				</div>
			</div>
		);
	}

	if (!task) return null;

	// Determine which tabs to show based on content
	const hasGuide =
		task.content?.type === "how_to_guide" && task.content.markdown;
	const hasShoppingList =
		task.content?.type === "shopping_list" && task.content.items?.length > 0;
	const hasChecklist =
		task.content?.type === "checklist" && task.content.items?.length > 0;
	const hasTabs = hasGuide || hasShoppingList || hasChecklist;

	// Extract shopping list from description if no explicit shopping list
	const extractedShoppingList =
		!hasShoppingList && task.description
			? extractShoppingListFromText(task.description)
			: null;
	const hasExtractedShoppingList =
		extractedShoppingList && extractedShoppingList.length > 0;

	const imageUrl = task.image_url
		? `${process.env.NEXT_PUBLIC_API_URL}${task.image_url}`
		: null;

	// Get task metadata
	const taskCategory = task.task_types?.[0] || "maintenance";
	const categoryDisplayName =
		taskCategory.charAt(0).toUpperCase() + taskCategory.slice(1);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b">
				<div className="flex items-center h-14 px-4">
					<button
						type="button"
						onClick={() => router.back()}
						className="me-4 p-2 -ms-2 rounded-full hover:bg-gray-100 transition-colors"
					>
						<ArrowLeft className="w-5 h-5 rtl:scale-x-[-1]" />
					</button>
					<h1 className="text-lg font-semibold">
						{t("tasks.details.taskDetails")}
					</h1>
				</div>
			</div>

			{/* Image Section */}
			{imageUrl && (
				<div className="relative w-full aspect-video bg-gray-100">
					<Image
						src={imageUrl}
						alt={task.title}
						fill
						className="object-cover"
						sizes="100vw"
						priority
					/>
				</div>
			)}

			{/* Main Content */}
			<div className="bg-white">
				<div className="px-4 py-6">
					{/* Title and Description */}
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{task.title}
					</h2>
					{task.description && (
						<p className="text-gray-600 mb-6">{task.description}</p>
					)}

					{/* Metadata */}
					<div className="space-y-4 mb-8">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
								<Package className="w-6 h-6 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">
									{t("tasks.fields.category")}
								</p>
								<p className="font-medium text-gray-900">
									{t(`tasks.types.${taskCategory}`) || categoryDisplayName}
								</p>
							</div>
						</div>

						{task.location && (
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
									<MapPin className="w-6 h-6 text-orange-600" />
								</div>
								<div>
									<p className="text-sm text-gray-500">
										{t("tasks.fields.location")}
									</p>
									<p className="font-medium text-gray-900">
										{task.location.name || categoryDisplayName}
									</p>
								</div>
							</div>
						)}

						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
								<Clock className="w-6 h-6 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">
									{t("tasks.details.estimatedTime")}
								</p>
								<p className="font-medium text-gray-900">30m</p>
							</div>
						</div>
					</div>

					{/* Tabs or Generate Guide Button */}
					{hasTabs || hasExtractedShoppingList ? (
						<div className="mb-8">
							<Tabs
								defaultValue={hasGuide ? "guide" : "shopping"}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-2 bg-gray-100 p-0.5 rounded-lg">
									{hasGuide && (
										<TabsTrigger
											value="guide"
											className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm rounded-md"
										>
											<span className="text-orange-600 mr-2">📖</span>
											{t("tasks.tabs.guide")}
										</TabsTrigger>
									)}
									{(hasShoppingList || hasExtractedShoppingList) && (
										<TabsTrigger
											value="shopping"
											className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
										>
											<span className="mr-2">🛒</span>
											{t("tasks.tabs.shoppingList")}
										</TabsTrigger>
									)}
								</TabsList>

								{/* Guide Content */}
								{hasGuide && task.content?.type === "how_to_guide" && (
									<TabsContent value="guide" className="mt-6">
										<h3 className="font-semibold text-lg mb-4">
											{t("tasks.tabs.steps")}
										</h3>
										<div className="prose prose-sm max-w-none">
											<ReactMarkdown>{task.content.markdown}</ReactMarkdown>
										</div>

										{task.content.images && task.content.images.length > 0 && (
											<div className="space-y-4 mt-6">
												{task.content.images.map(
													(
														img: { url: string; caption?: string },
														idx: number,
													) => (
														<div key={idx} className="space-y-2">
															<div className="relative w-full h-48 rounded-lg overflow-hidden">
																<Image
																	src={img.url}
																	alt={img.caption || `Image ${idx + 1}`}
																	fill
																	className="object-cover"
																/>
															</div>
															{img.caption && (
																<p className="text-sm text-gray-600 text-center">
																	{img.caption}
																</p>
															)}
														</div>
													),
												)}
											</div>
										)}
									</TabsContent>
								)}

								{/* Shopping List Content */}
								{(hasShoppingList || hasExtractedShoppingList) && (
									<TabsContent value="shopping" className="mt-6">
										<div className="space-y-2">
											{(hasShoppingList &&
											task.content?.type === "shopping_list"
												? task.content.items
												: extractedShoppingList || []
											).map((item: ShoppingListItem, idx: number) => (
												<label
													key={idx}
													className={cn(
														"flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
														item.purchased && "opacity-60",
													)}
												>
													<input
														type="checkbox"
														checked={item.purchased || false}
														className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
														readOnly
													/>
													<span
														className={cn(
															"flex-1 text-gray-900",
															item.purchased && "line-through",
														)}
													>
														{item.name}
													</span>
													{item.quantity && (
														<span className="text-sm text-gray-500">
															{item.quantity}
														</span>
													)}
												</label>
											))}
										</div>
									</TabsContent>
								)}
							</Tabs>
						</div>
					) : (
						// Generate Guide Button
						<button
							type="button"
							className="w-full mb-8 py-4 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
						>
							<Sparkles className="w-5 h-5" />
							{t("tasks.actions.generateGuide")}
						</button>
					)}
				</div>
			</div>

			{/* Bottom Actions */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
				{task.status === "completed" ? (
					<div className="w-full text-center py-3 px-4 bg-green-100 text-green-700 rounded-lg font-medium">
						{t("tasks.details.completed")}
					</div>
				) : (
					<>
						<Button
							onClick={handleSnoozeClick}
							variant="ghost"
							size="lg"
							className="w-12 h-12 p-0 rounded-full"
							disabled={task.status === "snoozed"}
						>
							<Clock className="w-6 h-6" />
						</Button>
						<Button
							onClick={handleComplete}
							size="lg"
							className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg h-12"
						>
							<Check className="w-5 h-5 mr-2" />
							{t("tasks.actions.markAsDone")}
						</Button>
					</>
				)}
			</div>

			<SnoozeModal
				isOpen={showSnoozeModal}
				onClose={() => {
					setShowSnoozeModal(false);
					setSnoozeError(null);
				}}
				onSnooze={handleSnooze}
				error={snoozeError}
			/>
		</div>
	);
}

export default function TaskDetailPage() {
	return (
		<Suspense fallback={<div className="min-h-screen" />}>
			<TaskDetailPageInner />
		</Suspense>
	);
}

// Helper function to extract shopping list from text
function extractShoppingListFromText(text: string): ShoppingListItem[] {
	const lines = text.split("\n").filter((line) => line.trim());
	const shoppingItems: ShoppingListItem[] = [];

	// Look for common shopping list patterns
	const listPatterns = [
		/^[-*•]\s*(.+)$/, // Bullet points
		/^\d+\.\s*(.+)$/, // Numbered lists
		/^(.+):\s*(\d+.*)$/, // Item: quantity
		/^(.+)\s*\((\d+.*)\)$/, // Item (quantity)
	];

	for (const line of lines) {
		// Try to match against patterns
		const patternMatch = listPatterns.find((pattern) => pattern.test(line));

		if (patternMatch) {
			const match = line.match(patternMatch);
			if (match) {
				const itemText = match[1].trim();
				const quantity = match[2]?.trim();

				// Check if quantity is embedded in the item text
				const quantityMatch = itemText.match(/^(.+?)\s*[-–]\s*(\d+.*)$/);

				shoppingItems.push({
					name: quantityMatch ? quantityMatch[1].trim() : itemText,
					quantity: quantityMatch ? quantityMatch[2].trim() : quantity,
					purchased: false,
				});
			}
		} else if (line.length > 2 && line.length < 100 && !line.includes(":")) {
			// Plain text that looks like an item
			shoppingItems.push({
				name: line.trim(),
				purchased: false,
			});
		}
	}

	return shoppingItems;
}
