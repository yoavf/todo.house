"use client";

import { usePathname, useRouter } from "next/navigation";

export function TabNavigation() {
	const router = useRouter();
	const pathname = usePathname();

	// Determine active tab based on URL
	const activeTab: "do-next" | "later" | "all" =
		pathname === "/later" ? "later" : pathname === "/tasks" ? "all" : "do-next";

	return (
		<div className="flex border-b border-gray-200">
			<button
				type="button"
				className={`py-2 px-4 text-sm font-medium ${
					activeTab === "do-next"
						? "text-orange-500 border-b-2 border-orange-500"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => router.push("/")}
			>
				Do next
			</button>
			<button
				type="button"
				className={`py-2 px-4 text-sm font-medium ${
					activeTab === "later"
						? "text-orange-500 border-b-2 border-orange-500"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => router.push("/later")}
			>
				Later
			</button>
			<button
				type="button"
				className={`py-2 px-4 text-sm font-medium ${
					activeTab === "all"
						? "text-orange-500 border-b-2 border-orange-500"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => router.push("/tasks")}
			>
				All
			</button>
		</div>
	);
}
