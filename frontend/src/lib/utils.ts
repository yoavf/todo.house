import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskType } from "./api";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getTaskTypeColor(type: TaskType): string {
	const colors: Record<TaskType, string> = {
		interior: "bg-blue-100 text-blue-700 hover:bg-blue-200",
		exterior: "bg-green-100 text-green-700 hover:bg-green-200",
		electricity: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
		plumbing: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
		appliances: "bg-purple-100 text-purple-700 hover:bg-purple-200",
		maintenance: "bg-orange-100 text-orange-700 hover:bg-orange-200",
		repair: "bg-red-100 text-red-700 hover:bg-red-200",
	};
	return colors[type] || "bg-gray-100 text-gray-700 hover:bg-gray-200";
}
