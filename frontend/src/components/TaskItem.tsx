import {
	ArrowRightIcon,
	ClockIcon,
	type LucideIcon,
	MoreHorizontalIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
		originalTask?: {
			thumbnail_url?: string;
			image_url?: string;
		};
	};
}

export function TaskItem({ task }: TaskItemProps) {
	const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
	const snoozeRef = useRef<HTMLDivElement>(null);
	const Icon = task.icon;

	// Get image URL from the task (populated by backend)
	const imageUrl =
		task.originalTask?.thumbnail_url || task.originalTask?.image_url;
	// Handle clicks outside the dropdown to close it
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				snoozeRef.current &&
				!(snoozeRef.current as HTMLElement).contains(event.target as Node)
			) {
				setShowSnoozeOptions(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);
	const handleSnooze = (option: string) => {
		console.log(`Task snoozed until: ${option}`);
		setShowSnoozeOptions(false);
		// Here you would typically update the task's due date based on the option
	};
	return (
		<div className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow relative overflow-hidden">
			{/* Background circular image - only show if we have an image URL */}
			{imageUrl && (
				<div className="absolute right-0 top-0 transform translate-x-1/4 -translate-y-1/4 w-24 h-24 overflow-hidden pointer-events-none">
					<div
						className="w-full h-full rounded-full opacity-60"
						style={{
							backgroundImage: `url(${imageUrl})`,
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
				<h3 className="text-base font-medium text-gray-800">{task.title}</h3>
				<p className="text-sm text-gray-500 mt-1">{task.description}</p>
				{/* Main action row - fixed layout */}
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
					<div className="flex items-center space-x-2">
						<div className="relative" ref={snoozeRef}>
							{!showSnoozeOptions ? (
								<button
									type="button"
									className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
									onClick={() => setShowSnoozeOptions(true)}
								>
									<ClockIcon size={18} />
								</button>
							) : (
								<div className="flex space-x-1.5">
									{["Later", "+1w", "Wknd"].map((option, index) => (
										<button
											type="button"
											key={option}
											className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-all transform animate-in fade-in zoom-in duration-200"
											style={{
												animationDelay: `${index * 50}ms`,
											}}
											onClick={() => handleSnooze(option)}
										>
											{option}
										</button>
									))}
								</div>
							)}
						</div>
						<button
							type="button"
							className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
						>
							<MoreHorizontalIcon size={18} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
