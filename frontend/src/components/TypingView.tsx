import { ArrowRightIcon, WandIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import type { TaskCreate } from "@/lib/api";
import { LocationSelector } from "./LocationSelector";

interface TypingViewProps {
	isOpen: boolean;
	onClose: () => void;
	onTaskCreated?: (task: TaskCreate) => void;
}

export function TypingView({
	isOpen,
	onClose,
	onTaskCreated,
}: TypingViewProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
	const [isAIGenerating, setIsAIGenerating] = useState(false);
	const [showFullForm, setShowFullForm] = useState(false);
	const t = useTranslations();

	// RTL support - we'll use CSS mirroring instead of conditional icons

	// Reset state when closed
	React.useEffect(() => {
		if (!isOpen) {
			setTitle("");
			setDescription("");
			setSelectedLocation(null);
			setIsAIGenerating(false);
			setShowFullForm(false);
		}
	}, [isOpen]);

	// Enable/disable the continue button based on title presence
	const canContinue = title.trim().length > 0;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would save the task
		const task: TaskCreate = {
			title,
			description: description || undefined,
			priority: "medium",
			source: "manual",
		};
		onTaskCreated?.(task);
		onClose();
	};

	const handleMagicGenerate = () => {
		setIsAIGenerating(true);
		// Simulate AI generating content
		setTimeout(() => {
			// Generate a description based on the title
			let aiDescription = "";
			if (title.toLowerCase().includes("clean")) {
				aiDescription =
					"Make sure to use the appropriate cleaning supplies. Set aside about 30 minutes for this task.";
			} else if (title.toLowerCase().includes("fix")) {
				aiDescription =
					"Check if you have the necessary tools before starting. This might require a trip to the hardware store.";
			} else if (title.toLowerCase().includes("buy")) {
				aiDescription =
					"Add this to your shopping list and pick it up during your next grocery run.";
			} else {
				aiDescription =
					"This task should be prioritized based on your schedule. Consider setting a reminder.";
			}
			// Set a default location if none selected
			if (!selectedLocation) {
				if (title.toLowerCase().includes("kitchen")) {
					setSelectedLocation("Kitchen");
				} else if (title.toLowerCase().includes("bathroom")) {
					setSelectedLocation("Bathroom");
				} else if (title.toLowerCase().includes("bedroom")) {
					setSelectedLocation("Bedroom");
				} else if (
					title.toLowerCase().includes("garden") ||
					title.toLowerCase().includes("lawn")
				) {
					setSelectedLocation("Back garden");
				} else if (
					title.toLowerCase().includes("outside") ||
					title.toLowerCase().includes("exterior")
				) {
					setSelectedLocation("Outdoor");
				} else {
					setSelectedLocation("Living Room");
				}
			}
			setDescription(aiDescription);
			setIsAIGenerating(false);
			setShowFullForm(true);
		}, 1500);
	};

	const handleContinueManually = () => {
		setShowFullForm(true);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-white z-50 flex flex-col">
			<div className="flex items-center justify-between p-4 border-b">
				<h2 className="text-lg font-medium">{t("tasks.actions.createTask")}</h2>
				<button
					type="button"
					className="p-2 rounded-full hover:bg-gray-100"
					onClick={onClose}
				>
					<XIcon size={24} />
				</button>
			</div>
			<form onSubmit={handleSubmit} className="flex-1 p-4 overflow-auto">
				<div className="max-w-md mx-auto">
					{/* Title input - always visible at the top */}
					<div className="mb-6">
						<h3 className="text-xl font-medium mb-4">
							{t("tasks.fields.title")}?
						</h3>
						<input
							type="text"
							className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							placeholder={t("tasks.placeholders.taskTitlePlaceholder")}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
					{/* Action buttons - only visible when title has content */}
					{canContinue && !showFullForm && (
						<div className="w-full space-y-3 mb-6 animate-in fade-in duration-300">
							<button
								type="button"
								className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center"
								onClick={handleMagicGenerate}
								disabled={isAIGenerating}
							>
								{isAIGenerating ? (
									t("common.loading")
								) : (
									<>
										<WandIcon size={18} className="mr-2" />
										{t("tasks.actions.completeWithAI")}
									</>
								)}
							</button>
							<button
								type="button"
								className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center"
								onClick={handleContinueManually}
							>
								<ArrowRightIcon size={18} className="me-2 rtl:scale-x-[-1]" />
								{t("tasks.actions.continueManually")}
							</button>
						</div>
					)}
					{/* Additional form fields - only visible after choosing to continue manually */}
					{showFullForm && (
						<div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
							<div className="mb-4">
								<label
									htmlFor="location"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("tasks.fields.location")}
								</label>
								<LocationSelector
									selectedLocation={selectedLocation}
									onLocationChange={setSelectedLocation}
								/>
							</div>
							<div className="mb-4">
								<label
									htmlFor="description"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("tasks.fields.descriptionOptional")}
								</label>
								<textarea
									id="description"
									className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
									placeholder={t("tasks.placeholders.descriptionPlaceholder")}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>
							<button
								type="submit"
								className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium mt-4"
							>
								{t("common.addTask")}
							</button>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}
