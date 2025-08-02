import { BathIcon, BoxIcon, HomeIcon } from "lucide-react";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
export function TaskList() {
	const [activeTab, setActiveTab] = useState("do-next");
	const tasks = [
		{
			id: 1,
			title: "Fix leaking kitchen faucet",
			description: "Sink has slow drip that needs new washer or cartridge",
			category: "Kitchen",
			icon: BoxIcon,
			addedTime: "2 days ago",
			estimatedTime: "30m",
			status: "do-next",
			imageUrl:
				"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
		{
			id: 2,
			title: "Mow the lawn",
			description: "Front and back yard need trimming, bag clippings",
			category: "Outdoor",
			icon: BoxIcon,
			addedTime: "5 hours ago",
			estimatedTime: "1h",
			status: "later",
			imageUrl:
				"https://images.unsplash.com/photo-1589923188900-85dae523342b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
		{
			id: 3,
			title: "Replace bathroom caulking",
			description: "Remove old caulk and apply new silicone around tub",
			category: "Bathroom",
			icon: BathIcon,
			addedTime: "Yesterday",
			estimatedTime: "45m",
			status: "suggested",
			imageUrl:
				"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
		{
			id: 4,
			title: "Change living room light bulbs",
			description: "Replace with LED bulbs, need ladder from garage",
			category: "Living Room",
			icon: HomeIcon,
			addedTime: "3 days ago",
			estimatedTime: "15m",
			status: "do-next",
			imageUrl:
				"https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
		},
	];
	const filteredTasks = tasks.filter(
		(task) => activeTab === "all" || task.status === activeTab,
	);
	return (
		<div>
			<div className="flex mb-4 border-b border-gray-200">
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${activeTab === "do-next" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700"}`}
					onClick={() => setActiveTab("do-next")}
				>
					Do next
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${activeTab === "later" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700"}`}
					onClick={() => setActiveTab("later")}
				>
					Later
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${activeTab === "suggested" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700"}`}
					onClick={() => setActiveTab("suggested")}
				>
					Suggested
				</button>
				<button
					type="button"
					className={`py-2 px-4 text-sm font-medium ${activeTab === "all" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700"}`}
					onClick={() => setActiveTab("all")}
				>
					All
				</button>
			</div>
			<div className="space-y-4">
				{filteredTasks.map((task) => (
					<TaskItem key={task.id} task={task} />
				))}
				{filteredTasks.length === 0 && (
					<div className="text-center py-8">
						<p className="text-gray-500">No tasks in this category</p>
					</div>
				)}
				<hr className="my-4 border-gray-200" />
				<div className="text-left">
					<a
						href="/tasks"
						className="text-sm text-gray-500 hover:text-orange-500"
					>
						All tasks &gt;
					</a>
				</div>
			</div>
		</div>
	);
}
