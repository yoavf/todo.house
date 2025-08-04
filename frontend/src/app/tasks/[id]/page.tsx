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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ShoppingListItem, type Task, tasksAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function TaskDetailPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const taskId = params.id as string;

	// Get initial data from URL params
	const initialTitle = searchParams.get("title");
	const initialDescription = searchParams.get("description");
	const initialImageUrl = searchParams.get("imageUrl");
	const initialStatus = searchParams.get("status") as Task["status"] | null;

	const [task, setTask] = useState<Task | null>(() => {
		// Create partial task from URL params if available
		if (initialTitle) {
			return {
				id: parseInt(taskId),
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

	useEffect(() => {
		const loadTask = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await tasksAPI.getTask(parseInt(taskId));
				setTask(data);
			} catch (err) {
				setError("Failed to load task");
				console.error("Error fetching task:", err);
			} finally {
				setLoading(false);
			}
		};
		loadTask();
	}, [taskId]);

	const handleSnooze = async () => {
		if (!task) return;
		try {
			const snoozedTask = await tasksAPI.snoozeTask(task.id, "tomorrow");
			setTask(snoozedTask);
			// Navigate back after snoozing
			router.back();
		} catch (err) {
			console.error("Error snoozing task:", err);
		}
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
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
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
						className="mr-4 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<h1 className="text-lg font-semibold">Task Details</h1>
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
								<p className="text-sm text-gray-500">Category</p>
								<p className="font-medium text-gray-900">
									{categoryDisplayName}
								</p>
							</div>
						</div>

						{task.location && (
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
									<MapPin className="w-6 h-6 text-orange-600" />
								</div>
								<div>
									<p className="text-sm text-gray-500">Location</p>
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
								<p className="text-sm text-gray-500">Estimated time</p>
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
											Guide
										</TabsTrigger>
									)}
									{(hasShoppingList || hasExtractedShoppingList) && (
										<TabsTrigger
											value="shopping"
											className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
										>
											<span className="mr-2">🛒</span>
											Shopping List
										</TabsTrigger>
									)}
								</TabsList>

								{/* Guide Content */}
								{hasGuide && task.content?.type === "how_to_guide" && (
									<TabsContent value="guide" className="mt-6">
										<h3 className="font-semibold text-lg mb-4">Steps</h3>
										<div className="prose prose-sm max-w-none">
											{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content from backend is sanitized */}
											<div
												dangerouslySetInnerHTML={{
													__html: task.content.markdown,
												}}
											/>
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
							Generate Guide with AI
						</button>
					)}
				</div>
			</div>

			{/* Bottom Actions */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
				{task.status !== "completed" && (
					<>
						<Button
							onClick={handleSnooze}
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
							Mark as Done
						</Button>
					</>
				)}
				{task.status === "completed" && (
					<div className="w-full text-center py-3 px-4 bg-green-100 text-green-700 rounded-lg font-medium">
						✓ Completed
					</div>
				)}
			</div>
		</div>
	);
}

// Helper function to extract shopping list from text
function extractShoppingListFromText(
	text: string,
): Array<{ name: string; quantity?: string; purchased: boolean }> {
	const lines = text.split("\n").filter((line) => line.trim());
	const shoppingItems: Array<{
		name: string;
		quantity?: string;
		purchased: boolean;
	}> = [];

	// Look for common shopping list patterns
	const listPatterns = [
		/^[-*•]\s*(.+)$/, // Bullet points
		/^\d+\.\s*(.+)$/, // Numbered lists
		/^(.+):\s*(\d+.*)$/, // Item: quantity
		/^(.+)\s*\((\d+.*)\)$/, // Item (quantity)
	];

	for (const line of lines) {
		let matched = false;
		for (const pattern of listPatterns) {
			const match = line.match(pattern);
			if (match) {
				const itemText = match[1].trim();
				const quantity = match[2]?.trim();

				// Parse quantity from item text if not captured
				const quantityMatch = itemText.match(/^(.+?)\s*[-–]\s*(\d+.*)$/);
				if (quantityMatch) {
					shoppingItems.push({
						name: quantityMatch[1].trim(),
						quantity: quantityMatch[2].trim(),
						purchased: false,
					});
				} else {
					shoppingItems.push({
						name: itemText,
						quantity: quantity,
						purchased: false,
					});
				}
				matched = true;
				break;
			}
		}

		// If no pattern matched but line looks like an item
		if (
			!matched &&
			line.length > 2 &&
			line.length < 100 &&
			!line.includes(":")
		) {
			shoppingItems.push({
				name: line.trim(),
				purchased: false,
			});
		}
	}

	return shoppingItems;
}
