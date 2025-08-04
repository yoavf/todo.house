"use client";

import { motion, useAnimation, useMotionValue } from "framer-motion";
import {
	ArrowRightIcon,
	ClockIcon,
	type LucideIcon,
	MoreHorizontalIcon,
} from "lucide-react";
import { useState } from "react";
import { tasksAPI } from "@/lib/api";
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
}

const SWIPE_THRESHOLD = -100;
const SWIPE_FULL_THRESHOLD = -200;

export function TaskItem({ task, onTaskUpdate }: TaskItemProps) {
	const [showSnoozeModal, setShowSnoozeModal] = useState(false);
	const Icon = task.icon;
	const controls = useAnimation();
	const x = useMotionValue(0);

	const imageUrl = task.thumbnail_url || task.image_url;
	const fullImageUrl = imageUrl
		? `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`
		: null;

	const handleDragEnd = async (
		_: MouseEvent | TouchEvent | PointerEvent,
		info: { offset: { x: number }; velocity: { x: number } },
	) => {
		const offset = info.offset.x;
		const velocity = info.velocity.x;

		// Gmail-style behavior: either trigger action or snap back
		if (
			offset < SWIPE_FULL_THRESHOLD ||
			(offset < SWIPE_THRESHOLD && velocity < -500)
		) {
			// Trigger snooze action
			setShowSnoozeModal(true);
			await controls.start({ x: 0 });
		} else {
			// Always snap back to closed position
			await controls.start({ x: 0 });
		}
	};

	const handleSnoozeClick = () => {
		setShowSnoozeModal(true);
		controls.start({ x: 0 });
	};

	const handleSnooze = async (date: Date) => {
		try {
			await tasksAPI.updateTask(task.id, {
				status: "snoozed",
				snoozed_until: date.toISOString(),
			});
			if (onTaskUpdate) {
				onTaskUpdate();
			}
		} catch (error) {
			console.error("Failed to snooze task:", error);
		}
	};

	return (
		<>
			<div
				className="relative overflow-hidden rounded-lg"
				data-testid={`task-item-${task.status}`}
				data-task-id={task.id}
			>
				{/* Background snooze action */}
				<div className="absolute inset-0 bg-orange-500 flex items-center justify-end pr-6 rounded-lg">
					<button
						type="button"
						onClick={handleSnoozeClick}
						className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
					>
						<ClockIcon size={24} className="text-white" />
					</button>
				</div>

				{/* Main swipeable content */}
				<motion.div
					drag="x"
					dragConstraints={{ left: SWIPE_FULL_THRESHOLD, right: 0 }}
					dragElastic={0.2}
					onDragEnd={handleDragEnd}
					animate={controls}
					style={{ x }}
					className="relative bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
				>
					{/* Background circular image */}
					{fullImageUrl && (
						<div className="absolute right-0 top-0 transform translate-x-1/4 -translate-y-1/4 w-24 h-24 overflow-hidden pointer-events-none">
							<div
								className="w-full h-full rounded-full opacity-60"
								style={{
									backgroundImage: `url(${fullImageUrl})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
									filter: "saturate(0.7)",
								}}
							/>
						</div>
					)}

					<div className="flex-1 relative z-10">
						<div className="flex items-center mb-2">
							<Icon size={16} className="text-orange-400 mr-1.5" />
							<span className="text-sm font-medium text-gray-500">
								{task.category}
							</span>
						</div>
						<h3 className="text-base font-medium text-gray-800">
							{task.title}
						</h3>
						{task.description && (
							<p className="text-sm text-gray-500 mt-1 line-clamp-2">
								{task.description}
							</p>
						)}

						{/* Main action row */}
						<div className="flex items-center justify-between mt-3">
							<button
								type="button"
								className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium flex items-center flex-shrink-0"
							>
								<ArrowRightIcon size={16} className="mr-1" />
								Do it{" "}
								<span className="ml-1 opacity-80 text-xs">
									· {task.estimatedTime}
								</span>
							</button>
							<button
								type="button"
								className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
							>
								<MoreHorizontalIcon size={18} />
							</button>
						</div>
					</div>
				</motion.div>
			</div>

			<SnoozeModal
				isOpen={showSnoozeModal}
				onClose={() => setShowSnoozeModal(false)}
				onSnooze={handleSnooze}
			/>
		</>
	);
}
