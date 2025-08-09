"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

// Demo component showing scroll restoration in action
export default function ScrollDemoPage() {
	const router = useRouter();
	const [showDetails, setShowDetails] = useState(false);

	// Use scroll restoration hook
	useScrollRestoration(undefined, {
		key: "scroll-demo-main",
		saveOnRouteChange: true,
		restoreOnMount: true,
	});

	if (showDetails) {
		return (
			<div className="min-h-screen p-8 bg-blue-50">
				<div className="max-w-2xl mx-auto">
					<button
						onClick={() => setShowDetails(false)}
						className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						← Back to List
					</button>
					<h1 className="text-2xl font-bold mb-4">Task Details</h1>
					<div className="bg-white p-6 rounded-lg shadow">
						<h2 className="text-xl font-semibold mb-3">Task: Fix the leaky faucet</h2>
						<p className="text-gray-600 mb-4">
							This is a detailed view of the task. When you go back to the list,
							your scroll position should be preserved.
						</p>
						<div className="space-y-3">
							<h3 className="font-medium">Steps:</h3>
							<ol className="list-decimal list-inside space-y-2 text-gray-700">
								<li>Turn off the water supply</li>
								<li>Remove the faucet handle</li>
								<li>Replace the O-ring or cartridge</li>
								<li>Reassemble the faucet</li>
								<li>Turn the water back on and test</li>
							</ol>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Scroll Position Demo</h1>
				<p className="mb-6 text-gray-600">
					Scroll down, click on a task to view details, then click back. 
					Your scroll position should be preserved!
				</p>
				
				<div className="space-y-4">
					{Array.from({ length: 50 }, (_, i) => (
						<div
							key={i}
							className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
							onClick={() => setShowDetails(true)}
						>
							<h3 className="font-semibold text-lg mb-2">
								Task #{i + 1}: Sample Home Task
							</h3>
							<p className="text-gray-600">
								This is a sample task description. Click to view details and test 
								scroll position restoration. Scroll position: Item {i + 1}
							</p>
							<div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
								<span>📍 Location: Kitchen</span>
								<span>⏱️ Est. time: 30 min</span>
								<span>🔧 Category: Maintenance</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}