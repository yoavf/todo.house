"use client";

import { motion, useAnimation, useMotionValue } from "framer-motion";
import {
	ArrowRightIcon,
	CameraIcon,
	ClockIcon,
	type LucideIcon,
	MoreHorizontalIcon,
	TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/hooks/useLocale";
import { tasksAPI } from "@/lib/api";
import { hapticFeedback } from "@/lib/haptics";
import { AnimatedTaskItem } from "./AnimatedTaskItem";
import { ImageLightbox } from "./ImageLightbox";
import { SnoozeModal } from "./SnoozeModal";

interface TaskItemProps {
	task: {
		id: number;
		title: string;
		description?: string;
		category: string;
		icon: LucideIcon;
		addedTime: string;
		estimatedTime: string;
		status: string;
		thumbnail_url?: string;
		image_url?: string;
	};
	onTaskUpdate?: () => void;
	activeTab?: "do-next" | "later" | "suggested" | "all";
}

// RTL-aware swipe thresholds
const getSwipeThresholds = (isRTL: boolean) => ({
	SWIPE_THRESHOLD: isRTL ? 100 : -100,
	SWIPE_FULL_THRESHOLD: isRTL ? 200 : -200,
});

// Animation timing constants
const ANIMATION_TIMING = {
	dialogCloseDelay: 200,
	slideOut: 300,
	heightCollapseDelay: 100,
} as const;

// Discriminated union for pending actions
type PendingAction =
	| { type: "snooze"; date: Date }
	| { type: "delete" }
	| { type: "unsnooze" };

export function TaskItem({ task, onTaskUpdate, activeTab }: TaskItemProps) {
	const [showSnoozeModal, setShowSnoozeModal] = useState(false);
	const [snoozeError, setSnoozeError] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isRemoving, setIsRemoving] = useState(false);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(
		null,
	);
	const [isDoItAnimating, setIsDoItAnimating] = useState(false);
	const [showLightbox, setShowLightbox] = useState(false);
	const Icon = task.icon;
	const controls = useAnimation();
	const doItButtonControls = useAnimation();
	const x = useMotionValue(0);
	const router = useRouter();

	// RTL support
	const { isRTL } = useLocale();
	const t = useTranslations();

	// Use CSS mirroring for RTL instead of conditional icons

	const imageUrl = task.thumbnail_url || task.image_url;
	const fullImageUrl = imageUrl
		? `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`
		: null;

	const executeAction = async () => {
		if (!pendingAction) return;

		try {
			if (pendingAction.type === "snooze") {
				await tasksAPI.updateTask(task.id, {
					status: "snoozed",
					snoozed_until: pendingAction.date.toISOString(),
				});
			} else if (pendingAction.type === "delete") {
				await tasksAPI.deleteTask(task.id);
			} else if (pendingAction.type === "unsnooze") {
				await tasksAPI.unsnoozeTask(task.id);
			}

			if (onTaskUpdate) {
				onTaskUpdate();
			}
		} catch (error) {
			console.error(`Failed to ${pendingAction.type} task:`, error);
			// Reset animation state on error
			setIsRemoving(false);
			setPendingAction(null);

			// Use consistent error dialog for all actions
			const actionName =
				pendingAction.type === "unsnooze" ? "unsnooze" : pendingAction.type;
			setErrorMessage(t("errors.actionFailed", { action: actionName }));
			setShowErrorDialog(true);
		}
	};

	const handleDragEnd = async (
		_: MouseEvent | TouchEvent | PointerEvent,
		info: { offset: { x: number }; velocity: { x: number } },
	) => {
		const offset = info.offset.x;
		const velocity = info.velocity.x;
		const { SWIPE_THRESHOLD, SWIPE_FULL_THRESHOLD } = getSwipeThresholds(isRTL);

		// RTL-aware Gmail-style behavior: either trigger action or snap back
		const shouldTriggerAction = isRTL
			? offset > SWIPE_FULL_THRESHOLD ||
				(offset > SWIPE_THRESHOLD && velocity > 500)
			: offset < SWIPE_FULL_THRESHOLD ||
				(offset < SWIPE_THRESHOLD && velocity < -500);

		if (shouldTriggerAction) {
			// Trigger snooze action
			setShowSnoozeModal(true);
			await controls.start({ x: 0 });
		} else {
			// Always snap back to closed position
			await controls.start({ x: 0 });
		}
	};

	const handleSnoozeClick = () => {
		hapticFeedback.buttonPress();
		setShowSnoozeModal(true);
		controls.start({ x: 0 });
	};

	const handleSnooze = async (date: Date) => {
		setSnoozeError(null);
		setShowSnoozeModal(false);

		// Delay animation to allow modal to fade out
		setTimeout(() => {
			setPendingAction({ type: "snooze", date });
			setIsRemoving(true);
		}, ANIMATION_TIMING.dialogCloseDelay);
	};

	const handleUnsnooze = async () => {
		// Start animation and set pending action
		setPendingAction({ type: "unsnooze" });
		setIsRemoving(true);
	};

	const handleDelete = async () => {
		hapticFeedback.error();
		setShowDeleteDialog(false);

		// Delay animation to allow dialog to fade out
		setTimeout(() => {
			setPendingAction({ type: "delete" });
			setIsRemoving(true);
		}, ANIMATION_TIMING.dialogCloseDelay);
	};

	const handleViewTask = async () => {
		// Trigger fun animation first
		hapticFeedback.success();
		setIsDoItAnimating(true);
		await doItButtonControls.start({
			scale: [1, 1.1, 0.95, 1],
			rotate: [0, -2, 2, 0],
			transition: {
				duration: 0.3,
				ease: "easeInOut",
			},
		});
		setIsDoItAnimating(false);

		// Pass initial data through URL params to show immediately
		const params = new URLSearchParams({
			title: task.title,
			...(task.description && { description: task.description }),
			...(task.image_url && { imageUrl: task.image_url }),
			status: task.status,
		});
		router.push(`/tasks/${task.id}?${params.toString()}`);
	};

	return (
		<AnimatedTaskItem
			taskId={task.id}
			isRemoving={isRemoving}
			onAnimationComplete={executeAction}
		>
			<div
				className="relative overflow-hidden rounded-lg"
				data-testid={`task-item-${task.status}`}
				data-task-id={task.id}
			>
				{/* Background snooze action - RTL aware positioning */}
				<div className="absolute inset-0 bg-orange-500 flex items-center rounded-lg justify-end rtl:justify-start pe-6 rtl:pe-0 rtl:ps-6">
					<button
						type="button"
						onClick={handleSnoozeClick}
						className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors touch-feedback haptic-light"
					>
						<ClockIcon size={24} className="text-white" />
					</button>
				</div>

				{/* Main swipeable content */}
				<motion.div
					drag="x"
					dragConstraints={
						isRTL
							? {
									left: 0,
									right: getSwipeThresholds(isRTL).SWIPE_FULL_THRESHOLD,
								}
							: {
									left: getSwipeThresholds(isRTL).SWIPE_FULL_THRESHOLD,
									right: 0,
								}
					}
					dragElastic={0.2}
					dragTransition={{
						bounceDamping: 20,
						bounceStiffness: 300,
						power: 0.3,
					}}
					onDragEnd={handleDragEnd}
					animate={controls}
					style={{ x }}
					onClick={(e) => {
						// Only navigate if not clicking on buttons or dragging
						const target = e.target as HTMLElement;
						if (
							!target.closest("button") &&
							!target.closest('[role="button"]') &&
							!target.closest('[role="menu"]') &&
							!target.closest('[role="menuitem"]') &&
							!target.closest(".task-image") &&
							Math.abs(x.get()) < 5
						) {
							handleViewTask();
						}
					}}
					className="relative bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
				>
					{/* Top image section */}
					{fullImageUrl && (
						<div className="relative task-image">
							<div
								className="w-full h-40 bg-gray-100"
								style={{
									backgroundImage: `url(${fullImageUrl})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
							{/* Camera icon overlay */}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setShowLightbox(true);
								}}
								className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
							>
								<CameraIcon size={16} className="text-white" />
							</button>
						</div>
					)}

					<div className="flex-1 relative z-10 p-4">
						<div className="flex items-center mb-2">
							<Icon size={16} className="text-orange-400 me-1.5" />
							<span className="text-sm font-medium text-gray-500">
								{task.category}
							</span>
						</div>
						<h3 className="text-base font-medium text-gray-800 text-start">
							{task.title}
						</h3>
						{task.description && (
							<p className="text-sm text-gray-500 mt-1 line-clamp-2 text-start">
								{task.description}
							</p>
						)}

						{/* Main action row */}
						<div className="flex items-center justify-between mt-3">
							<motion.button
								type="button"
								onClick={handleViewTask}
								animate={doItButtonControls}
								disabled={isDoItAnimating}
								className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium flex items-center flex-shrink-0 hover:bg-orange-600 transition-colors disabled:opacity-80 touch-feedback haptic-medium"
							>
								<ArrowRightIcon size={16} className="me-1 rtl:scale-x-[-1]" />
								{t("common.doIt")}{" "}
								<span className="ms-1 opacity-80 text-xs">
									· {task.estimatedTime}
								</span>
							</motion.button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0 outline-none focus:outline-none active:outline-none rounded-md"
									>
										<MoreHorizontalIcon size={18} />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align={isRTL ? "start" : "end"}
									side="top"
									sideOffset={-5}
									onClick={(e) => e.stopPropagation()}
								>
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											if (activeTab === "later" || task.status === "later") {
												handleUnsnooze();
											} else {
												setShowSnoozeModal(true);
											}
										}}
										className="cursor-pointer"
									>
										<ClockIcon className="me-2 h-4 w-4" />
										{activeTab === "later" || task.status === "later"
											? t("common.unsnooze")
											: t("common.snooze")}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											setShowDeleteDialog(true);
										}}
										variant="destructive"
										className="cursor-pointer"
									>
										<TrashIcon className="me-2 h-4 w-4" />
										{t("common.delete")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</motion.div>
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

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("dialogs.deleteTask")}</DialogTitle>
						<DialogDescription>
							{t("dialogs.deleteTaskDescription", { title: task.title })}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							{t("common.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("dialogs.error")}</DialogTitle>
						<DialogDescription>{errorMessage}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowErrorDialog(false)}>
							{t("common.ok")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{fullImageUrl && (
				<ImageLightbox
					isOpen={showLightbox}
					onClose={() => setShowLightbox(false)}
					imageUrl={fullImageUrl}
					title={task.title}
				/>
			)}
		</AnimatedTaskItem>
	);
}
