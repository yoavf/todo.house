import type { Locale, RTLLocale } from "@/i18n/config";

/**
 * Locale-related types for the application
 */

export type { Locale, RTLLocale };

/**
 * Locale detection result with metadata
 */
export interface LocaleDetectionResult {
	locale: Locale;
	isRTL: boolean;
	source: "header" | "default" | "user-setting";
}

/**
 * Locale context for components
 */
export interface LocaleContext {
	locale: Locale;
	isRTL: boolean;
	direction: "ltr" | "rtl";
}

/**
 * Translation message structure
 */
export interface TranslationMessages {
	common: {
		delete: string;
		cancel: string;
		confirm: string;
		save: string;
		edit: string;
		loading: string;
		ok: string;
		goBack: string;
		addTask: string;
		doIt: string;
		snooze: string;
		unsnooze: string;
		complete: string;
		selectDate: string;
	};
	dialogs: {
		deleteConfirm: string;
		deleteTask: string;
		deleteTaskDescription: string;
		unsavedChanges: string;
		error: string;
	};
	time: {
		tomorrow: string;
		thisWeekend: string;
		nextWeek: string;
		later: string;
		andTime: string;
		estimatedTime: string;
	};
	tasks: {
		priority: {
			low: string;
			medium: string;
			high: string;
		};
		status: {
			active: string;
			snoozed: string;
			completed: string;
			later: string;
		};
		types: {
			interior: string;
			exterior: string;
			electricity: string;
			plumbing: string;
			hvac: string;
			appliances: string;
			general: string;
			maintenance: string;
		};
		fields: {
			title: string;
			description: string;
			descriptionOptional: string;
			priority: string;
			category: string;
		};
		placeholders: {
			descriptionPlaceholder: string;
		};
		actions: {
			reviewTask: string;
			createTask: string;
			viewTask: string;
			editTask: string;
			deleteTask: string;
			snoozeTask: string;
			completeTask: string;
		};
		tabs: {
			guide: string;
			shoppingList: string;
			steps: string;
		};
	};
	speech: {
		iHeard: string;
		reviewYourTask: string;
	};
	errors: {
		generic: string;
		network: string;
		validation: string;
		notFound: string;
		invalidTaskId: string;
		failedToLoadTask: string;
		failedToCreateTask: string;
		failedToUpdateTask: string;
		failedToDeleteTask: string;
		failedToSnoozeTask: string;
		failedToUnsnoozeTask: string;
		actionFailed: string;
	};
}

/**
 * Type for translation function parameters
 */
export type TranslationParams = Record<string, string | number>;

/**
 * Type for nested translation keys
 */
export type TranslationKey =
	| keyof TranslationMessages
	| `${keyof TranslationMessages}.${string}`;
