import { isRTLLocale, type Locale } from "@/i18n/config";
import type { LocaleContext } from "@/types/locale";

/**
 * Create locale context object with derived properties
 */
export function createLocaleContext(locale: Locale): LocaleContext {
	const isRTL = isRTLLocale(locale);

	return {
		locale,
		isRTL,
		direction: isRTL ? "rtl" : "ltr",
	};
}

/**
 * Get HTML direction attribute value for a locale
 */
export function getHTMLDirection(locale: Locale): "ltr" | "rtl" {
	return isRTLLocale(locale) ? "rtl" : "ltr";
}

/**
 * Get CSS direction value for a locale
 */
export function getCSSDirection(locale: Locale): "ltr" | "rtl" {
	return getHTMLDirection(locale);
}

/**
 * Check if a locale requires RTL layout
 */
export function requiresRTL(locale: Locale): boolean {
	return isRTLLocale(locale);
}

/**
 * Get RTL-aware icon transform classes
 */
export function getRTLIconClasses(locale: Locale, shouldMirror = true) {
	const isRTL = isRTLLocale(locale);
	return {
		mirror: isRTL && shouldMirror ? "scale-x-[-1]" : "",
		conditionalMirror: shouldMirror ? "rtl:scale-x-[-1]" : "",
	};
}

/**
 * Combine classes with RTL awareness
 */
export function combineRTLClasses(
	baseClasses: string,
	rtlClasses: string,
	locale: Locale,
): string {
	const isRTL = isRTLLocale(locale);
	return isRTL ? `${baseClasses} ${rtlClasses}` : baseClasses;
}
