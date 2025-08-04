import { defaultLocale, isSupportedLocale, type Locale } from "@/i18n/config";

// Re-export defaultLocale for convenience
export { defaultLocale };

interface ParsedLocale {
	locale: string;
	quality: number;
}

/**
 * Parse Accept-Language header and extract locale preferences with quality values
 * Format: "en-US,en;q=0.9,he;q=0.8,fr;q=0.7"
 */
function parseAcceptLanguageHeader(acceptLanguage: string): ParsedLocale[] {
	return acceptLanguage
		.split(",")
		.map((lang) => {
			const [locale, quality] = lang.trim().split(";q=");
			return {
				locale: locale.toLowerCase(),
				quality: quality ? parseFloat(quality) : 1.0,
			};
		})
		.sort((a, b) => b.quality - a.quality);
}

/**
 * Extract the primary language code from a locale string
 * Examples: "en-US" -> "en", "he-IL" -> "he", "en" -> "en"
 */
function extractLanguageCode(locale: string): string {
	return locale.split("-")[0];
}

/**
 * Core locale detection logic extracted to avoid duplication
 */
function detectLocaleFromParsedHeader(
	acceptLanguageHeader: string,
): Locale | null {
	try {
		const parsedLocales = parseAcceptLanguageHeader(acceptLanguageHeader);

		// First, try to find exact matches (including region codes)
		for (const { locale } of parsedLocales) {
			// Note: Using toLowerCase() here is safe for locale codes as they follow
			// RFC 5646 standard where language codes are case-insensitive
			const normalizedLocale = locale.toLowerCase();
			if (isSupportedLocale(normalizedLocale)) {
				return normalizedLocale;
			}
		}

		// Then, try to match by language code only
		for (const { locale } of parsedLocales) {
			const languageCode = extractLanguageCode(locale);
			if (isSupportedLocale(languageCode)) {
				return languageCode;
			}
		}
	} catch (error) {
		console.warn("Failed to parse Accept-Language header:", error);
	}

	return null;
}

/**
 * Detect the best supported locale from Accept-Language header
 * Falls back to default locale if no supported locale is found
 */
export function detectLocaleFromHeader(acceptLanguageHeader?: string): Locale {
	if (!acceptLanguageHeader) {
		return defaultLocale;
	}

	const detectedLocale = detectLocaleFromParsedHeader(acceptLanguageHeader);
	return detectedLocale || defaultLocale;
}

/**
 * Detect locale from Next.js request headers
 */
export function detectLocale(request: Request): Locale {
	const acceptLanguage = request.headers.get("accept-language");
	return detectLocaleFromHeader(acceptLanguage || undefined);
}

/**
 * Enhanced locale detection with detailed result information
 */
export function detectLocaleWithMetadata(acceptLanguageHeader?: string): {
	locale: Locale;
	source: "header" | "default";
	originalHeader?: string;
} {
	if (!acceptLanguageHeader) {
		return {
			locale: defaultLocale,
			source: "default",
		};
	}

	const detectedLocale = detectLocaleFromParsedHeader(acceptLanguageHeader);

	if (detectedLocale) {
		return {
			locale: detectedLocale,
			source: "header",
			originalHeader: acceptLanguageHeader,
		};
	}

	return {
		locale: defaultLocale,
		source: "default",
		originalHeader: acceptLanguageHeader,
	};
}
