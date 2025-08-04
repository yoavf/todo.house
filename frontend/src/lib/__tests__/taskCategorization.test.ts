import { addDays, addWeeks, endOfWeek, startOfWeek } from "date-fns";
import type { Task } from "@/lib/api";
import {
	categorizeSnoozedTasks,
	shouldShowAsSingleList,
} from "../taskCategorization";

// Mock tasks for testing
const createMockTask = (id: number, snoozedUntil?: string): Task => ({
	id,
	title: `Task ${id}`,
	description: `Description for task ${id}`,
	priority: "medium" as const,
	completed: false,
	status: "snoozed" as const,
	snoozed_until: snoozedUntil,
	source: "manual" as const,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	user_id: "test-user",
	task_types: ["maintenance"],
});

describe("taskCategorization", () => {
	const now = new Date("2024-01-15T10:00:00Z"); // Monday
	const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
	const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
	const nextWeekStart = addWeeks(currentWeekStart, 1);
	const nextWeekEnd = addWeeks(currentWeekEnd, 1);

	// Mock Date.now to return consistent results
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	describe("categorizeSnoozedTasks", () => {
		it("categorizes tasks correctly by time periods", () => {
			const tasks: Task[] = [
				// This week tasks
				createMockTask(1, addDays(currentWeekStart, 2).toISOString()), // Wednesday this week
				createMockTask(2, currentWeekEnd.toISOString()), // End of this week

				// Next week tasks
				createMockTask(3, addDays(nextWeekStart, 1).toISOString()), // Tuesday next week
				createMockTask(4, nextWeekEnd.toISOString()), // End of next week

				// Later tasks
				createMockTask(5, addWeeks(now, 3).toISOString()), // 3 weeks from now
				createMockTask(6, addWeeks(now, 10).toISOString()), // 10 weeks from now

				// Task without snoozed_until date
				createMockTask(7, undefined),

				// Non-snoozed task (should be ignored)
				{ ...createMockTask(8), status: "active" as const },
			];

			const result = categorizeSnoozedTasks(tasks);

			expect(result.thisWeek).toHaveLength(2);
			expect(result.thisWeek.map((t) => t.id)).toEqual([1, 2]);

			expect(result.nextWeek).toHaveLength(2);
			expect(result.nextWeek.map((t) => t.id)).toEqual([3, 4]);

			expect(result.later).toHaveLength(3);
			expect(result.later.map((t) => t.id)).toEqual([5, 6, 7]);
		});

		it("handles empty task list", () => {
			const result = categorizeSnoozedTasks([]);

			expect(result.thisWeek).toHaveLength(0);
			expect(result.nextWeek).toHaveLength(0);
			expect(result.later).toHaveLength(0);
		});

		it("handles tasks with invalid snoozed_until dates", () => {
			const tasks: Task[] = [
				createMockTask(1, "invalid-date"),
				createMockTask(2, "2024-13-40T25:70:00Z"), // Invalid date format
			];

			const result = categorizeSnoozedTasks(tasks);

			// Invalid dates should be treated as "later"
			expect(result.later).toHaveLength(2);
			expect(result.thisWeek).toHaveLength(0);
			expect(result.nextWeek).toHaveLength(0);
		});

		it("only processes snoozed tasks", () => {
			const tasks: Task[] = [
				{
					...createMockTask(1, addDays(now, 2).toISOString()),
					status: "active" as const,
				},
				{
					...createMockTask(2, addDays(now, 2).toISOString()),
					status: "completed" as const,
				},
				createMockTask(3, addDays(now, 2).toISOString()), // snoozed
			];

			const result = categorizeSnoozedTasks(tasks);

			expect(result.thisWeek).toHaveLength(1);
			expect(result.thisWeek[0].id).toBe(3);
			expect(result.nextWeek).toHaveLength(0);
			expect(result.later).toHaveLength(0);
		});
	});

	describe("shouldShowAsSingleList", () => {
		it("returns true when only later tasks exist", () => {
			const categorized = {
				thisWeek: [],
				nextWeek: [],
				later: [createMockTask(1), createMockTask(2)],
			};

			expect(shouldShowAsSingleList(categorized)).toBe(true);
		});

		it("returns false when this week tasks exist", () => {
			const categorized = {
				thisWeek: [createMockTask(1)],
				nextWeek: [],
				later: [createMockTask(2)],
			};

			expect(shouldShowAsSingleList(categorized)).toBe(false);
		});

		it("returns false when next week tasks exist", () => {
			const categorized = {
				thisWeek: [],
				nextWeek: [createMockTask(1)],
				later: [createMockTask(2)],
			};

			expect(shouldShowAsSingleList(categorized)).toBe(false);
		});

		it("returns false when no later tasks exist", () => {
			const categorized = {
				thisWeek: [],
				nextWeek: [],
				later: [],
			};

			expect(shouldShowAsSingleList(categorized)).toBe(false);
		});

		it("returns false when both time-specific and later tasks exist", () => {
			const categorized = {
				thisWeek: [createMockTask(1)],
				nextWeek: [createMockTask(2)],
				later: [createMockTask(3)],
			};

			expect(shouldShowAsSingleList(categorized)).toBe(false);
		});
	});
});
