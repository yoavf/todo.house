import { CheckIcon, MicIcon, XIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { TaskCreate } from "@/lib/api";

interface SpeechResultsProps {
	speechText: string;
	onClose: () => void;
	onAddTask: (task: TaskCreate) => void;
}

export function SpeechResults({
	speechText,
	onClose,
	onAddTask,
}: SpeechResultsProps) {
	const [title, setTitle] = useState(speechText);
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onAddTask({
			title,
			description,
			priority,
			source: "manual",
		});
	};

	return (
		<div className="fixed inset-0 bg-white z-50 flex flex-col">
			<div className="flex items-center justify-between p-4 border-b">
				<h2 className="text-lg font-medium">Review Your Task</h2>
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
					{/* Speech recognition indicator */}
					<div className="mb-6 p-4 bg-orange-50 rounded-lg flex items-start">
						<MicIcon size={20} className="text-orange-500 mr-3 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm text-gray-600 mb-1">I heard:</p>
							<p className="text-gray-900 font-medium italic">"{speechText}"</p>
						</div>
					</div>

					{/* Task title */}
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Task Title
						</label>
						<input
							type="text"
							className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					{/* Description */}
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description (optional)
						</label>
						<textarea
							className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							placeholder="Add any additional details..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					{/* Priority */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Priority
						</label>
						<div className="flex gap-3">
							{(["low", "medium", "high"] as const).map((p) => (
								<button
									key={p}
									type="button"
									className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium capitalize transition-colors ${
										priority === p
											? "border-orange-500 bg-orange-50 text-orange-700"
											: "border-gray-300 text-gray-700 hover:border-gray-400"
									}`}
									onClick={() => setPriority(p)}
								>
									{p}
								</button>
							))}
						</div>
					</div>

					{/* Submit button */}
					<button
						type="submit"
						className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
					>
						<CheckIcon size={20} />
						Add Task
					</button>
				</div>
			</form>
		</div>
	);
}
