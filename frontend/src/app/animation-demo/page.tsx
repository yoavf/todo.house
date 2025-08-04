"use client";

import { HomeIcon } from "lucide-react";
import { TaskItem } from "../../components/TaskItem";

const mockTask = {
	id: 1,
	title: "Test the Do it button animation",
	description: "Click the 'Do it' button to see the fun bounce animation!",
	category: "Demo",
	icon: HomeIcon,
	addedTime: "1 hour ago",
	estimatedTime: "30m",
	status: "do-next",
};

export default function AnimationDemo() {
	return (
		<div className="p-8 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Do it Button Animation Demo</h1>
			<p className="text-gray-600 mb-6">
				Click the orange "Do it" button below to see the fun bounce animation!
			</p>
			<TaskItem task={mockTask} onTaskUpdate={() => {}} />
		</div>
	);
}
