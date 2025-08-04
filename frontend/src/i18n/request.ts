import { getRequestConfig } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { detectLocale } from "@/lib/locale-detection";

export default getRequestConfig(async ({ requestLocale }) => {
	// This function runs on every request to determine the locale
	// requestLocale is undefined in our case since we don't use locale-based routing

	// For now, we'll use a placeholder. In the next task, we'll implement
	// proper locale detection from headers
	const locale: Locale = "en";

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
});
