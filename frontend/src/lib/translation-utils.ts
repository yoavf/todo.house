import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import type { TranslationMessages } from "@/types/locale";

/**
 * Translation loading error types
 */
export class TranslationLoadError extends Error {
	constructor(
		public locale: Locale,
		public cause?: Error,
	) {
		super(`Failed to load translations for locale: ${locale}`);
		this.name = "TranslationLoadError";
	}
}

/**
 * Cache for loaded translation messages
 */
const translationCache = new Map<Locale, TranslationMessages>();

/**
 * Load translation messages for a specific locale with error handling and caching
 */
export async function loadTranslations(
	locale: Locale,
): Promise<TranslationMessages> {
	// Check cache first
	const cached = translationCache.get(locale);
	if (cached) {
		return cached;
	}

	try {
		// Dynamic import of translation file
		const messages = await import(`../messages/${locale}.json`);
		// Handle both real imports and Jest mocks
		const translations = (messages.default?.default ||
			messages.default ||
			messages) as TranslationMessages;

		// Validate that the loaded translations have the expected structure
		if (!isValidTranslationStructure(translations)) {
			throw new Error(`Invalid translation structure for locale: ${locale}`);
		}

		// Cache the loaded translations
		translationCache.set(locale, translations);
		return translations;
	} catch (error) {
		console.error(`Failed to load translations for ${locale}:`, error);

		// If loading the requested locale fails and it's not the default locale,
		// try to load the default locale as fallback
		if (locale !== defaultLocale) {
			console.warn(
				`Falling back to default locale (${defaultLocale}) for translations`,
			);
			return loadTranslations(defaultLocale);
		}

		// If even the default locale fails, throw an error
		throw new TranslationLoadError(
			locale,
			error instanceof Error ? error : new Error(String(error)),
		);
	}
}

/**
 * Preload translations for multiple locales
 */
export async function preloadTranslations(locales: Locale[]): Promise<void> {
	const loadPromises = locales.map((locale) =>
		loadTranslations(locale).catch((error) => {
			console.warn(`Failed to preload translations for ${locale}:`, error);
		}),
	);

	await Promise.allSettled(loadPromises);
}

/**
 * Clear translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
	translationCache.clear();
}

/**
 * Get cached translation count (useful for debugging)
 */
export function getCachedTranslationCount(): number {
	return translationCache.size;
}

/**
 * Basic validation to ensure translation structure is correct
 */
function isValidTranslationStructure(
	translations: unknown,
): translations is TranslationMessages {
	if (!translations || typeof translations !== "object") {
		return false;
	}

	const t = translations as Record<string, unknown>;

	// Check for required top-level keys
	const requiredKeys = [
		"common",
		"dialogs",
		"time",
		"tasks",
		"speech",
		"errors",
	];
	for (const key of requiredKeys) {
		if (!(key in t) || typeof t[key] !== "object" || t[key] === null) {
			return false;
		}
	}

	// Check for some essential nested keys
	const common = t.common as Record<string, unknown>;
	if (
		typeof common.delete !== "string" ||
		typeof common.cancel !== "string" ||
		typeof common.addTask !== "string"
	) {
		return false;
	}

	const tasks = t.tasks as Record<string, unknown>;
	if (!tasks.priority || typeof tasks.priority !== "object") {
		return false;
	}

	const tasksPriority = tasks.priority as Record<string, unknown>;
	if (
		typeof tasksPriority.low !== "string" ||
		typeof tasksPriority.medium !== "string" ||
		typeof tasksPriority.high !== "string"
	) {
		return false;
	}

	// Check for new nested structures
	if (!tasks.fields || typeof tasks.fields !== "object") {
		return false;
	}

	const speech = t.speech as Record<string, unknown>;
	if (
		typeof speech.iHeard !== "string" ||
		typeof speech.reviewYourTask !== "string"
	) {
		return false;
	}

	return true;
}

/**
 * Get translation key path for type-safe access
 */
export function getTranslationKeyPath<T extends keyof TranslationMessages>(
	namespace: T,
	key: keyof TranslationMessages[T],
): string {
	return `${namespace}.${String(key)}`;
}

/**
 * Get nested translation key path
 */
export function getNestedTranslationKeyPath<
	T extends keyof TranslationMessages,
	K extends keyof TranslationMessages[T],
	N extends keyof TranslationMessages[T][K],
>(namespace: T, key: K, nestedKey: N): string {
	return `${namespace}.${String(key)}.${String(nestedKey)}`;
}

/**
 * Translation key builder for common patterns
 */
export const translationKeys = {
	common: {
		delete: "common.delete",
		cancel: "common.cancel",
		confirm: "common.confirm",
		save: "common.save",
		edit: "common.edit",
		loading: "common.loading",
		ok: "common.ok",
		goBack: "common.goBack",
		addTask: "common.addTask",
		doIt: "common.doIt",
		snooze: "common.snooze",
		unsnooze: "common.unsnooze",
		complete: "common.complete",
		selectDate: "common.selectDate",
	},
	dialogs: {
		deleteConfirm: "dialogs.deleteConfirm",
		deleteTask: "dialogs.deleteTask",
		deleteTaskDescription: "dialogs.deleteTaskDescription",
		unsavedChanges: "dialogs.unsavedChanges",
		error: "dialogs.error",
	},
	time: {
		tomorrow: "time.tomorrow",
		thisWeekend: "time.thisWeekend",
		nextWeek: "time.nextWeek",
		later: "time.later",
		andTime: "time.andTime",
		estimatedTime: "time.estimatedTime",
	},
	tasks: {
		priority: {
			low: "tasks.priority.low",
			medium: "tasks.priority.medium",
			high: "tasks.priority.high",
		},
		status: {
			active: "tasks.status.active",
			snoozed: "tasks.status.snoozed",
			completed: "tasks.status.completed",
			later: "tasks.status.later",
		},
		types: {
			interior: "tasks.types.interior",
			exterior: "tasks.types.exterior",
			electricity: "tasks.types.electricity",
			plumbing: "tasks.types.plumbing",
			hvac: "tasks.types.hvac",
			appliances: "tasks.types.appliances",
			general: "tasks.types.general",
			maintenance: "tasks.types.maintenance",
		},
		fields: {
			title: "tasks.fields.title",
			description: "tasks.fields.description",
			descriptionOptional: "tasks.fields.descriptionOptional",
			priority: "tasks.fields.priority",
			category: "tasks.fields.category",
		},
		placeholders: {
			descriptionPlaceholder: "tasks.placeholders.descriptionPlaceholder",
		},
		actions: {
			reviewTask: "tasks.actions.reviewTask",
			createTask: "tasks.actions.createTask",
			viewTask: "tasks.actions.viewTask",
			editTask: "tasks.actions.editTask",
			deleteTask: "tasks.actions.deleteTask",
			snoozeTask: "tasks.actions.snoozeTask",
			completeTask: "tasks.actions.completeTask",
		},
		tabs: {
			guide: "tasks.tabs.guide",
			shoppingList: "tasks.tabs.shoppingList",
			steps: "tasks.tabs.steps",
		},
	},
	speech: {
		iHeard: "speech.iHeard",
		reviewYourTask: "speech.reviewYourTask",
	},
	errors: {
		generic: "errors.generic",
		network: "errors.network",
		validation: "errors.validation",
		notFound: "errors.notFound",
		invalidTaskId: "errors.invalidTaskId",
		failedToLoadTask: "errors.failedToLoadTask",
		failedToCreateTask: "errors.failedToCreateTask",
		failedToUpdateTask: "errors.failedToUpdateTask",
		failedToDeleteTask: "errors.failedToDeleteTask",
		failedToSnoozeTask: "errors.failedToSnoozeTask",
		failedToUnsnoozeTask: "errors.failedToUnsnoozeTask",
		actionFailed: "errors.actionFailed",
	},
} as const;

/**
 * Type for translation key constants
 */
export type TranslationKeyConstants = typeof translationKeys;
