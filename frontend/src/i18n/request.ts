import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { defaultLocale, detectLocaleFromHeader } from "@/lib/locale-detection";

export default getRequestConfig(async ({ requestLocale }) => {
	// This function runs on every request to determine the locale
	// requestLocale is undefined in our case since we don't use locale-based routing

	// Detect locale from Accept-Language header
	let locale: Locale = defaultLocale;

	try {
		const headersList = await headers();
		const acceptLanguage = headersList.get("accept-language");
		locale = detectLocaleFromHeader(acceptLanguage || undefined);
	} catch (error) {
		console.warn("Failed to detect locale from headers, using default:", error);
		locale = defaultLocale;
	}

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
});
