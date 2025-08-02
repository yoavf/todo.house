import { CheckIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { useState } from "react";

interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	category: string;
	selected: boolean;
}

interface SuggestionResultsProps {
	imageUrl: string;
	onClose: () => void;
	onAddTasks: (tasks: Task[]) => void;
}

export function SuggestionResults({
	imageUrl,
	onClose,
	onAddTasks,
}: SuggestionResultsProps) {
	// Mock generated tasks
	const [tasks, setTasks] = useState<Task[]>([
		{
			id: "1",
			title: "Fix leaking faucet",
			description: "The kitchen faucet appears to be dripping",
			priority: "high",
			category: "Plumbing",
			selected: true,
		},
		{
			id: "2",
			title: "Replace cabinet handle",
			description: "Missing handle on upper cabinet door",
			priority: "medium",
			category: "Maintenance",
			selected: true,
		},
		{
			id: "3",
			title: "Clean countertops",
			description: "Deep clean needed for kitchen surfaces",
			priority: "low",
			category: "Cleaning",
			selected: true,
		},
	]);

	const toggleTask = (id: string) => {
		setTasks(
			tasks.map((task) =>
				task.id === id ? { ...task, selected: !task.selected } : task,
			),
		);
	};

	const selectedTasks = tasks.filter((task) => task.selected);

	const handleAddTasks = () => {
		onAddTasks(selectedTasks);
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "text-red-600 bg-red-50";
			case "medium":
				return "text-yellow-600 bg-yellow-50";
			case "low":
				return "text-green-600 bg-green-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	return (
		<div className="fixed inset-0 bg-white z-50 flex flex-col">
			<div className="flex items-center justify-between p-4 border-b">
				<h2 className="text-lg font-medium">Suggested Tasks</h2>
				<button
					type="button"
					className="p-2 rounded-full hover:bg-gray-100"
					onClick={onClose}
				>
					<XIcon size={24} />
				</button>
			</div>

			<div className="flex-1 overflow-auto">
				{/* Image preview */}
				<div className="p-4">
					<div className="rounded-lg overflow-hidden bg-gray-100 h-48">
						<img
							src={imageUrl}
							alt="Analyzed"
							className="w-full h-full object-cover"
						/>
					</div>
				</div>

				{/* Task list */}
				<div className="px-4 pb-4">
					<p className="text-sm text-gray-600 mb-4">
						We found {tasks.length} potential tasks. Select the ones you'd like
						to add:
					</p>

					<div className="space-y-3">
						{tasks.map((task) => (
							<button
								key={task.id}
								type="button"
								className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
									task.selected
										? "border-orange-500 bg-orange-50"
										: "border-gray-200 bg-white"
								}`}
								onClick={() => toggleTask(task.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">{task.title}</h3>
										{task.description && (
											<p className="text-sm text-gray-600 mt-1">
												{task.description}
											</p>
										)}
										<div className="flex items-center gap-3 mt-2">
											<span
												className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
													task.priority,
												)}`}
											>
												{task.priority}
											</span>
											<span className="text-xs text-gray-500">
												{task.category}
											</span>
										</div>
									</div>
									<div
										className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
											task.selected
												? "border-orange-500 bg-orange-500"
												: "border-gray-300"
										}`}
									>
										{task.selected && (
											<CheckIcon size={16} className="text-white" />
										)}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Bottom action bar */}
			<div className="p-4 border-t bg-gray-50">
				<button
					type="button"
					className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={handleAddTasks}
					disabled={selectedTasks.length === 0}
				>
					Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
					<ChevronRightIcon size={20} />
				</button>
			</div>
		</div>
	);
}
