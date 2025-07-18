import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  type Schedule,
  ScheduleFrequency,
  SnoozeDuration,
  type Task,
} from "../types/Task";
import {
  DAYS_IN_WEEK,
  DAYS_TO_NEXT_WEEK,
  DEFAULT_MORNING_HOUR,
  DEFAULT_MORNING_MINUTE,
  DEFAULT_MORNING_SECOND,
} from "../utils/constants";
import {
  getFirstWorkday,
  getLastDayOfMonth,
  getNextWeekday,
  getNextWeekendStart,
  isLastDayOfWeekend,
  parseDateField,
  parseRequiredDateField
} from "../utils/dateUtils";
import { getCurrentLocale } from "../utils/localeUtils";
import { logger } from "../utils/logger";

interface TaskStore {
	tasks: Task[];
	hydrated: boolean;
	recentlyAddedId: string | null;
	add: (task: Omit<Task, "id" | "createdAt" | "order">) => string;
	update: (id: string, partial: Partial<Task>) => void;
	remove: (id: string) => void;
	toggle: (id: string) => void;
	clearRecentlyAdded: () => void;
	hydrate: () => Promise<void>;
	persist: () => Promise<void>;
	reorderTasks: (newTaskOrder: Task[]) => void;
	snoozeTask: (id: string, duration: SnoozeDuration) => void;
	unsnoozeTask: (id: string) => void;
	setDueDate: (id: string, dueDate?: Date) => void;
	setSchedule: (id: string, schedule?: Schedule) => void;
	isSnoozed: (task: Task) => boolean;
}

const STORAGE_KEY = "@todo_house_tasks";

const calculateSnoozeDate = (duration: SnoozeDuration): Date | undefined => {
	const now = new Date();
	const locale = getCurrentLocale();

	switch (duration) {
		case SnoozeDuration.TOMORROW: {
			const tomorrow = new Date(now);
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(
				DEFAULT_MORNING_HOUR,
				DEFAULT_MORNING_MINUTE,
				DEFAULT_MORNING_SECOND,
				0,
			);
			return tomorrow;
		}

		case SnoozeDuration.THIS_WEEKEND:
			return getNextWeekendStart(now, locale);

		case SnoozeDuration.NEXT_WORKDAY: {
			const firstWorkday = getFirstWorkday(locale);

			// If today is the last day of weekend, go to next week's first workday
			if (isLastDayOfWeekend(now, locale)) {
				const nextWeekStart = new Date(now);
				nextWeekStart.setDate(nextWeekStart.getDate() + DAYS_TO_NEXT_WEEK);
				return getNextWeekday(firstWorkday, nextWeekStart);
			}

			// Otherwise, go to the next occurrence of first workday
			return getNextWeekday(firstWorkday, now);
		}

		case SnoozeDuration.WHENEVER:
			// No specific date - return undefined to indicate indefinite snooze
			return undefined;

		default:
			return now;
	}
};

// Helper function to calculate the next due date based on a schedule
const calculateNextDueDate = (
	schedule: Schedule,
	currentDueDate?: Date,
): Date | undefined => {
	if (!schedule) return undefined;

	const baseDate = currentDueDate || new Date();
	const nextDate = new Date(baseDate);

	switch (schedule.frequency) {
		case ScheduleFrequency.DAILY:
			nextDate.setDate(nextDate.getDate() + schedule.interval);
			break;
		case ScheduleFrequency.WEEKLY:
			nextDate.setDate(nextDate.getDate() + DAYS_IN_WEEK * schedule.interval);
			break;
		case ScheduleFrequency.MONTHLY: {
			// Handle month calculation with proper month-end handling
			const currentDate = nextDate.getDate();
			const currentMonth = nextDate.getMonth();

			// First set the month
			nextDate.setDate(1); // Temporarily set to 1st to prevent invalid dates when target month has fewer days
			nextDate.setMonth(currentMonth + schedule.interval);

			// Then set the date, clamping to the last day of the month if needed
			const lastDayOfMonth = getLastDayOfMonth(nextDate);
			nextDate.setDate(Math.min(currentDate, lastDayOfMonth));
			break;
		}
		case ScheduleFrequency.YEARLY:
			nextDate.setFullYear(nextDate.getFullYear() + schedule.interval);
			break;
		default:
			return undefined;
	}

	// Check if we've reached the end date or max occurrences
	if (schedule.endDate && nextDate > schedule.endDate) {
		return undefined;
	}

	return nextDate;
};

export const useTaskStore = create<TaskStore>((set, get) => ({
	tasks: [],
	hydrated: false,
	recentlyAddedId: null,

	add: (taskData) => {
		const newTask: Task = {
			...taskData,
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			createdAt: new Date(),
			order: Date.now(), // New tasks appear at top
			isScheduled: !!taskData.schedule,
			isFutureTask: !!taskData.isFutureTask,
		};

		set((state) => ({
			tasks: [...state.tasks, newTask],
			recentlyAddedId: newTask.id,
		}));

		get().persist();
		return newTask.id;
	},

	update: (id, partial) => {
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, ...partial } : task,
			),
		}));

		get().persist();
	},

	remove: (id) => {
		set((state) => ({
			tasks: state.tasks.filter((task) => task.id !== id),
		}));

		get().persist();
	},

	toggle: (id) => {
		const currentTasks = get().tasks;
		const task = currentTasks.find((task) => task.id === id);
		if (!task) return;

		const isCompleting = !task.completed;

		// Toggle the completion status
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, completed: !task.completed } : task,
			),
		}));

		// Handle scheduled tasks
		if (task.schedule) {
			// Generate a seriesId if this is the first task in a series
			const seriesId = task.seriesId || `series-${task.id}`;

			// Update the current task with the seriesId if it doesn't have one
			if (!task.seriesId) {
				set((state) => ({
					tasks: state.tasks.map((t) => (t.id === id ? { ...t, seriesId } : t)),
				}));
			}

			if (isCompleting) {
				// Task is being completed - create the next occurrence
				const nextDueDate = calculateNextDueDate(task.schedule, task.dueDate);

				if (nextDueDate) {
					// First, check if there's already a future task in this series
					const existingFutureTask = currentTasks.find(
						(t) => t.seriesId === seriesId && t.isFutureTask && !t.completed,
					);

					if (existingFutureTask) {
						// Update the existing future task if needed
						if (
							existingFutureTask.dueDate?.getTime() !== nextDueDate.getTime()
						) {
							set((state) => ({
								tasks: state.tasks.map((t) =>
									t.id === existingFutureTask.id
										? { ...t, dueDate: nextDueDate }
										: t,
								),
							}));
						}
					} else {
						// Create a new future task with the next due date
						get().add({
							title: task.title,
							location: task.location,
							completed: false,
							dueDate: nextDueDate,
							schedule: task.schedule,
							imageUri: task.imageUri,
							isFutureTask: true,
							seriesId: seriesId,
						});

						logger.info(
							"TaskStore",
							"Created next scheduled task with due date:",
							nextDueDate,
						);
					}
				}
			} else {
				// Task is being uncompleted - remove any future tasks in this series
				set((state) => ({
					tasks: state.tasks.filter(
						(t) => !(t.seriesId === seriesId && t.isFutureTask && !t.completed),
					),
				}));
			}
		}

		get().persist();
	},

	clearRecentlyAdded: () => {
		set({ recentlyAddedId: null });
	},

	hydrate: async () => {
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);
			if (stored) {
				const tasks = JSON.parse(stored).map((task: any) => ({
					...task,
					createdAt: parseRequiredDateField(task.createdAt),
					dueDate: parseDateField(task.dueDate),
					snoozeUntil: parseDateField(task.snoozeUntil),
					isWheneverSnoozed: task.isWheneverSnoozed || false,
					order:
						task.order !== undefined
							? task.order
							: task.createdAt
								? parseRequiredDateField(task.createdAt).getTime()
								: Date.now(),
					imageUri: task.imageUri || undefined,
					// Parse schedule dates if they exist
					schedule: task.schedule
						? {
								...task.schedule,
								endDate: parseDateField(task.schedule.endDate),
							}
						: undefined,
					isScheduled: task.isScheduled || false,
					isFutureTask: task.isFutureTask || false,
					seriesId: task.seriesId || undefined,
				}));
				set({ tasks, hydrated: true });
			} else {
				set({ hydrated: true });
			}
		} catch (error) {
			logger.error("TaskStore", "Failed to hydrate tasks:", error);
			set({ hydrated: true });
		}
	},

	persist: async () => {
		try {
			const { tasks } = get();
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
		} catch (error) {
			logger.error("TaskStore", "Failed to persist tasks:", error);
		}
	},

	// Enhanced task list methods
	reorderTasks: (newTaskOrder: Task[]) => {
		set((state) => {
			const snoozedTasks = state.tasks.filter(
				(task) => task.snoozeUntil && task.snoozeUntil > new Date(),
			);
			const futureTasks = state.tasks.filter((task) => task.isFutureTask);

			// Update order values based on new array order
			const baseTimestamp = Date.now();
			const reorderedTasks = newTaskOrder.map((task, index) => ({
				...task,
				order: baseTimestamp - index,
			}));

			return {
				tasks: [...reorderedTasks, ...snoozedTasks, ...futureTasks],
			};
		});

		get().persist();
	},

	snoozeTask: (id: string, duration: SnoozeDuration) => {
		const snoozeUntil = calculateSnoozeDate(duration);
		const isWheneverSnoozed = duration === SnoozeDuration.WHENEVER;

		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, snoozeUntil, isWheneverSnoozed } : task,
			),
		}));

		get().persist();
	},

	unsnoozeTask: (id: string) => {
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id
					? { ...task, snoozeUntil: undefined, isWheneverSnoozed: false }
					: task,
			),
		}));

		get().persist();
	},

	setDueDate: (id: string, dueDate?: Date) => {
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, dueDate } : task,
			),
		}));

		get().persist();
	},

	setSchedule: (id: string, schedule?: Schedule) => {
		const task = get().tasks.find((task) => task.id === id);
		if (!task) return;

		// Generate a seriesId if adding a schedule and there isn't one already
		const seriesId = schedule
			? task.seriesId || `series-${task.id}`
			: undefined;

		// If removing a schedule, we need to clean up any future tasks in this series
		if (task.schedule && !schedule && task.seriesId) {
			set((state) => ({
				tasks: state.tasks.filter(
					(t) =>
						!(t.seriesId === task.seriesId && t.isFutureTask && !t.completed),
				),
			}));
		}

		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id
					? {
							...t,
							schedule,
							isScheduled: !!schedule,
							seriesId: schedule ? seriesId : undefined,
						}
					: t,
			),
		}));

		get().persist();
	},

	isSnoozed: (task: Task) => {
		const now = new Date();
		return (
			task.isWheneverSnoozed ||
			(task.snoozeUntil ? task.snoozeUntil > now : false)
		);
	},
}));

// Helper functions for filtering and sorting tasks
export const getActiveTasks = (tasks: Task[]): Task[] => {
	const now = new Date();

	return tasks
		.filter(
			(task) =>
				// Not snoozed
				!task.isWheneverSnoozed &&
				(!task.snoozeUntil || task.snoozeUntil <= now) &&
				// Not a future task
				!task.isFutureTask,
		)
		.sort((a, b) => {
			// Sort by completion status first
			if (a.completed !== b.completed) {
				return a.completed ? 1 : -1;
			}

			// Within each completion group, sort by due date first
			if (a.dueDate && b.dueDate) {
				return a.dueDate.getTime() - b.dueDate.getTime();
			}
			if (a.dueDate && !b.dueDate) return -1;
			if (!a.dueDate && b.dueDate) return 1;

			// Then by order (newest first)
			return b.order - a.order;
		});
};

export const getSnoozedTasks = (tasks: Task[]): Task[] => {
	const now = new Date();

	return tasks
		.filter(
			(task) =>
				// Is snoozed
				(task.isWheneverSnoozed ||
					(task.snoozeUntil && task.snoozeUntil > now)) &&
				// Not a future task
				!task.isFutureTask,
		)
		.sort((a, b) => {
			// Whenever tasks go to the bottom
			if (a.isWheneverSnoozed && !b.isWheneverSnoozed) return 1;
			if (!a.isWheneverSnoozed && b.isWheneverSnoozed) return -1;

			// Sort by snooze date for timed snoozes
			if (a.snoozeUntil && b.snoozeUntil) {
				return a.snoozeUntil.getTime() - b.snoozeUntil.getTime();
			}
			return 0;
		});
};

export const getFutureTasks = (tasks: Task[]): Task[] => {
	return tasks
		.filter((task) => task.isFutureTask)
		.sort((a, b) => {
			// Sort by due date
			if (a.dueDate && b.dueDate) {
				return a.dueDate.getTime() - b.dueDate.getTime();
			}
			if (a.dueDate && !b.dueDate) return -1;
			if (!a.dueDate && b.dueDate) return 1;

			// Then by creation date (newest first)
			return b.createdAt.getTime() - a.createdAt.getTime();
		});
};
