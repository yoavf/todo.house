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
	};
	dialogs: {
		deleteConfirm: string;
		unsavedChanges: string;
	};
	time: {
		tomorrow: string;
		thisWeekend: string;
		nextWeek: string;
		later: string;
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
		};
		types: {
			interior: string;
			exterior: string;
			electricity: string;
			plumbing: string;
			hvac: string;
			appliances: string;
			general: string;
		};
	};
	errors: {
		generic: string;
		network: string;
		validation: string;
		notFound: string;
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
