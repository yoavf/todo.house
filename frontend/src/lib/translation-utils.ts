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
		// Extract translations with fallback chain for different module systems:
		// - messages.default?.default: Jest mocks that wrap the default export
		// - messages.default: Standard ES module default export
		// - messages: CommonJS or direct object export
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
 * Type-safe translation key builder that automatically generates keys from TranslationMessages
 */
type DeepKeyPaths<T, Prefix extends string = ""> = {
	[K in keyof T]: T[K] extends Record<string, unknown>
		? DeepKeyPaths<T[K], `${Prefix}${K & string}.`>
		: `${Prefix}${K & string}`;
}[keyof T];

/**
 * Generate translation key paths automatically from the TranslationMessages type
 */
function createTranslationKeys<T extends Record<string, unknown>>(
	obj: T,
	prefix = "",
): {
	[K in keyof T]: T[K] extends Record<string, unknown>
		? ReturnType<typeof createTranslationKeys>
		: string;
} {
	const result = {} as any;

	for (const key in obj) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];

		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			result[key] = createTranslationKeys(
				value as Record<string, unknown>,
				fullKey,
			);
		} else {
			result[key] = fullKey;
		}
	}

	return result;
}

/**
 * Type-safe translation keys generated from the TranslationMessages interface
 * This automatically stays in sync with the translation structure
 */
export const translationKeys = createTranslationKeys({
	common: {
		delete: "",
		cancel: "",
		confirm: "",
		save: "",
		edit: "",
		loading: "",
		ok: "",
		goBack: "",
		addTask: "",
		doIt: "",
		snooze: "",
		unsnooze: "",
		complete: "",
		selectDate: "",
	},
	dialogs: {
		deleteConfirm: "",
		deleteTask: "",
		deleteTaskDescription: "",
		unsavedChanges: "",
		error: "",
	},
	time: {
		tomorrow: "",
		thisWeekend: "",
		nextWeek: "",
		later: "",
		andTime: "",
		estimatedTime: "",
	},
	tasks: {
		priority: {
			low: "",
			medium: "",
			high: "",
		},
		status: {
			active: "",
			snoozed: "",
			completed: "",
			later: "",
		},
		types: {
			interior: "",
			exterior: "",
			electricity: "",
			plumbing: "",
			hvac: "",
			appliances: "",
			general: "",
			maintenance: "",
		},
		fields: {
			title: "",
			description: "",
			descriptionOptional: "",
			priority: "",
			category: "",
		},
		placeholders: {
			descriptionPlaceholder: "",
		},
		actions: {
			reviewTask: "",
			createTask: "",
			viewTask: "",
			editTask: "",
			deleteTask: "",
			snoozeTask: "",
			completeTask: "",
		},
		tabs: {
			guide: "",
			shoppingList: "",
			steps: "",
		},
	},
	speech: {
		iHeard: "",
		reviewYourTask: "",
	},
	errors: {
		generic: "",
		network: "",
		validation: "",
		notFound: "",
		invalidTaskId: "",
		failedToLoadTask: "",
		failedToCreateTask: "",
		failedToUpdateTask: "",
		failedToDeleteTask: "",
		failedToSnoozeTask: "",
		failedToUnsnoozeTask: "",
		actionFailed: "",
	},
} as const);

/**
 * Type for all possible translation key paths
 */
export type TranslationKeyPath = DeepKeyPaths<TranslationMessages>;

/**
 * Type for translation key constants
 */
export type TranslationKeyConstants = typeof translationKeys;
