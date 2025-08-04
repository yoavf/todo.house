import {
	addWeeks,
	endOfDay,
	endOfWeek,
	isWithinInterval,
	startOfDay,
	startOfWeek,
} from "date-fns";
import type { Task } from "@/lib/api";

export interface CategorizedTasks {
	thisWeek: Task[];
	nextWeek: Task[];
	later: Task[];
}

/**
 * Categorizes snoozed tasks by their snoozed_until date into time-based groups
 */
export function categorizeSnoozedTasks(tasks: Task[]): CategorizedTasks {
	const now = new Date();
	const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
	const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
	const nextWeekStart = addWeeks(currentWeekStart, 1);
	const nextWeekEnd = addWeeks(currentWeekEnd, 1);

	const snoozedTasks = tasks.filter((task) => task.status === "snoozed");

	const categorized: CategorizedTasks = {
		thisWeek: [],
		nextWeek: [],
		later: [],
	};

	for (const task of snoozedTasks) {
		if (!task.snoozed_until) {
			// If no snoozed_until date, treat as "later"
			categorized.later.push(task);
			continue;
		}

		const snoozedDate = new Date(task.snoozed_until);

		// Handle invalid dates - treat as "later"
		if (isNaN(snoozedDate.getTime())) {
			categorized.later.push(task);
			continue;
		}

		// Check if task is snoozed until this week
		if (
			isWithinInterval(snoozedDate, {
				start: currentWeekStart,
				end: currentWeekEnd,
			})
		) {
			categorized.thisWeek.push(task);
		}
		// Check if task is snoozed until next week
		else if (
			isWithinInterval(snoozedDate, { start: nextWeekStart, end: nextWeekEnd })
		) {
			categorized.nextWeek.push(task);
		}
		// Everything else goes to "later"
		else {
			categorized.later.push(task);
		}
	}

	return categorized;
}

/**
 * Determines if we should show section headers or display as a single list
 * Returns true if only "later" tasks exist and no other sections have tasks
 */
export function shouldShowAsSingleList(categorized: CategorizedTasks): boolean {
	return (
		categorized.thisWeek.length === 0 &&
		categorized.nextWeek.length === 0 &&
		categorized.later.length > 0
	);
}
