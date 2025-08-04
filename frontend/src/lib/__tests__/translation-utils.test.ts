import {
	clearTranslationCache,
	getCachedTranslationCount,
	getNestedTranslationKeyPath,
	getTranslationKeyPath,
	loadTranslations,
	preloadTranslations,
	TranslationLoadError,
	translationKeys,
} from "../translation-utils";

// Mock the dynamic imports
jest.mock("../../messages/en.json", () => ({
	default: {
		common: {
			delete: "Delete",
			cancel: "Cancel",
			confirm: "Confirm",
			save: "Save",
			edit: "Edit",
			loading: "Loading...",
			ok: "OK",
			goBack: "Go Back",
			addTask: "Add Task",
			doIt: "Do it",
			snooze: "Snooze",
			unsnooze: "Unsnooze",
			complete: "Complete",
			selectDate: "Select date",
		},
		dialogs: {
			deleteConfirm: 'Are you sure you want to delete "{title}"?',
			deleteTask: "Delete Task",
			deleteTaskDescription:
				'Are you sure you want to delete "{title}"? This action cannot be undone.',
			unsavedChanges:
				"You have unsaved changes. Are you sure you want to leave?",
			error: "Error",
		},
		time: {
			tomorrow: "Tomorrow",
			thisWeekend: "This weekend",
			nextWeek: "Next week",
			later: "Later",
			andTime: "and time",
			estimatedTime: "Estimated time",
		},
		tasks: {
			priority: {
				low: "Low",
				medium: "Medium",
				high: "High",
			},
			status: {
				active: "Active",
				snoozed: "Snoozed",
				completed: "Completed",
				later: "Later",
			},
			types: {
				interior: "Interior",
				exterior: "Exterior",
				electricity: "Electricity",
				plumbing: "Plumbing",
				hvac: "HVAC",
				appliances: "Appliances",
				general: "General",
				maintenance: "Maintenance",
			},
			fields: {
				title: "Task Title",
				description: "Description",
				descriptionOptional: "Description (optional)",
				priority: "Priority",
				category: "Category",
			},
			placeholders: {
				descriptionPlaceholder: "Add any additional details...",
			},
			actions: {
				reviewTask: "Review Your Task",
				createTask: "Create Task",
				viewTask: "View Task",
				editTask: "Edit Task",
				deleteTask: "Delete Task",
				snoozeTask: "Snooze Task",
				completeTask: "Complete Task",
			},
			tabs: {
				guide: "Guide",
				shoppingList: "Shopping List",
				steps: "Steps",
			},
		},
		speech: {
			iHeard: "I heard:",
			reviewYourTask: "Review Your Task",
		},
		errors: {
			generic: "Something went wrong. Please try again.",
			network: "Network error. Please check your connection.",
			validation: "Please check your input and try again.",
			notFound: "The requested item was not found.",
			invalidTaskId: "Invalid task ID",
			failedToLoadTask: "Failed to load task",
			failedToCreateTask: "Failed to create task",
			failedToUpdateTask: "Failed to update task",
			failedToDeleteTask: "Failed to delete task",
			failedToSnoozeTask: "Failed to snooze task",
			failedToUnsnoozeTask: "Failed to unsnooze task",
			actionFailed:
				"Failed to {action} task. Please check your connection and try again.",
		},
	},
}));

jest.mock("../../messages/he.json", () => ({
	default: {
		common: {
			delete: "מחק",
			cancel: "ביטול",
			confirm: "אישור",
			save: "שמור",
			edit: "ערוך",
			loading: "טוען...",
			ok: "אישור",
			goBack: "חזור",
			addTask: "הוסף משימה",
			doIt: "בצע",
			snooze: "דחה",
			unsnooze: "בטל דחייה",
			complete: "השלם",
			selectDate: "בחר תאריך",
		},
		dialogs: {
			deleteConfirm: 'האם אתה בטוח שברצונך למחוק את "{title}"?',
			deleteTask: "מחק משימה",
			deleteTaskDescription:
				'האם אתה בטוח שברצונך למחוק את "{title}"? פעולה זו לא ניתנת לביטול.',
			unsavedChanges: "יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?",
			error: "שגיאה",
		},
		time: {
			tomorrow: "מחר",
			thisWeekend: "בסוף השבוע",
			nextWeek: "השבוע הבא",
			later: "מאוחר יותר",
			andTime: "ושעה",
			estimatedTime: "זמן משוער",
		},
		tasks: {
			priority: {
				low: "נמוכה",
				medium: "בינונית",
				high: "גבוהה",
			},
			status: {
				active: "פעיל",
				snoozed: "נדחה",
				completed: "הושלם",
				later: "מאוחר יותר",
			},
			types: {
				interior: "פנים",
				exterior: "חוץ",
				electricity: "חשמל",
				plumbing: "אינסטלציה",
				hvac: "מיזוג אוויר",
				appliances: "מכשירי חשמל",
				general: "כללי",
				maintenance: "תחזוקה",
			},
			fields: {
				title: "כותרת המשימה",
				description: "תיאור",
				descriptionOptional: "תיאור (אופציונלי)",
				priority: "עדיפות",
				category: "קטגוריה",
			},
			placeholders: {
				descriptionPlaceholder: "הוסף פרטים נוספים...",
			},
			actions: {
				reviewTask: "סקור את המשימה",
				createTask: "צור משימה",
				viewTask: "הצג משימה",
				editTask: "ערוך משימה",
				deleteTask: "מחק משימה",
				snoozeTask: "דחה משימה",
				completeTask: "השלם משימה",
			},
			tabs: {
				guide: "מדריך",
				shoppingList: "רשימת קניות",
				steps: "שלבים",
			},
		},
		speech: {
			iHeard: "שמעתי:",
			reviewYourTask: "סקור את המשימה",
		},
		errors: {
			generic: "משהו השתבש. אנא נסה שוב.",
			network: "שגיאת רשת. אנא בדוק את החיבור שלך.",
			validation: "אנא בדוק את הקלט שלך ונסה שוב.",
			notFound: "הפריט המבוקש לא נמצא.",
			invalidTaskId: "מזהה משימה לא חוקי",
			failedToLoadTask: "נכשל בטעינת המשימה",
			failedToCreateTask: "נכשל ביצירת המשימה",
			failedToUpdateTask: "נכשל בעדכון המשימה",
			failedToDeleteTask: "נכשל במחיקת המשימה",
			failedToSnoozeTask: "נכשל בדחיית המשימה",
			failedToUnsnoozeTask: "נכשל בביטול דחיית המשימה",
			actionFailed: "נכשל ב{action} המשימה. אנא בדוק את החיבור שלך ונסה שוב.",
		},
	},
}));

describe("translation-utils", () => {
	beforeEach(() => {
		clearTranslationCache();
		jest.clearAllMocks();
	});

	describe("loadTranslations", () => {
		it("should load English translations successfully", async () => {
			const translations = await loadTranslations("en");

			expect(translations).toBeDefined();
			expect(translations.common.delete).toBe("Delete");
			expect(translations.tasks.priority.high).toBe("High");
		});

		it("should load Hebrew translations successfully", async () => {
			const translations = await loadTranslations("he");

			expect(translations).toBeDefined();
			expect(translations.common.delete).toBe("מחק");
			expect(translations.tasks.priority.high).toBe("גבוהה");
		});

		it("should cache loaded translations", async () => {
			await loadTranslations("en");
			expect(getCachedTranslationCount()).toBe(1);

			// Load again - should use cache
			await loadTranslations("en");
			expect(getCachedTranslationCount()).toBe(1);
		});

		it("should handle unsupported locale gracefully", async () => {
			// Test with an unsupported locale - should fallback to English
			const translations = await loadTranslations("fr" as any);

			// Should fallback to English
			expect(translations.common.delete).toBe("Delete");
		});
	});

	describe("preloadTranslations", () => {
		it("should preload multiple locales", async () => {
			await preloadTranslations(["en", "he"]);

			expect(getCachedTranslationCount()).toBe(2);
		});

		it("should handle failed preloads gracefully", async () => {
			// Should not throw even if some locales fail
			await expect(
				preloadTranslations(["en", "fr" as any, "he"]),
			).resolves.not.toThrow();

			// Should still cache the successful ones
			expect(getCachedTranslationCount()).toBeGreaterThan(0);
		});
	});

	describe("cache management", () => {
		it("should clear translation cache", async () => {
			await loadTranslations("en");
			expect(getCachedTranslationCount()).toBe(1);

			clearTranslationCache();
			expect(getCachedTranslationCount()).toBe(0);
		});

		it("should track cached translation count", async () => {
			expect(getCachedTranslationCount()).toBe(0);

			await loadTranslations("en");
			expect(getCachedTranslationCount()).toBe(1);

			await loadTranslations("he");
			expect(getCachedTranslationCount()).toBe(2);
		});
	});

	describe("key path utilities", () => {
		it("should generate translation key paths", () => {
			expect(getTranslationKeyPath("common", "delete")).toBe("common.delete");
			expect(getTranslationKeyPath("tasks", "priority")).toBe("tasks.priority");
		});

		it("should generate nested translation key paths", () => {
			expect(getNestedTranslationKeyPath("tasks", "priority", "high")).toBe(
				"tasks.priority.high",
			);
			expect(getNestedTranslationKeyPath("tasks", "status", "active")).toBe(
				"tasks.status.active",
			);
		});
	});

	describe("translation key constants", () => {
		it("should provide correct key constants for common translations", () => {
			expect(translationKeys.common.delete).toBe("common.delete");
			expect(translationKeys.common.cancel).toBe("common.cancel");
			expect(translationKeys.common.addTask).toBe("common.addTask");
		});

		it("should provide correct key constants for task translations", () => {
			expect(translationKeys.tasks.priority.high).toBe("tasks.priority.high");
			expect(translationKeys.tasks.status.active).toBe("tasks.status.active");
			expect(translationKeys.tasks.fields.title).toBe("tasks.fields.title");
		});

		it("should provide correct key constants for error translations", () => {
			expect(translationKeys.errors.generic).toBe("errors.generic");
			expect(translationKeys.errors.network).toBe("errors.network");
			expect(translationKeys.errors.actionFailed).toBe("errors.actionFailed");
		});

		it("should provide correct key constants for dialog translations", () => {
			expect(translationKeys.dialogs.deleteConfirm).toBe(
				"dialogs.deleteConfirm",
			);
			expect(translationKeys.dialogs.deleteTask).toBe("dialogs.deleteTask");
		});

		it("should provide correct key constants for speech translations", () => {
			expect(translationKeys.speech.iHeard).toBe("speech.iHeard");
			expect(translationKeys.speech.reviewYourTask).toBe(
				"speech.reviewYourTask",
			);
		});
	});
});
