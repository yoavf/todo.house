export const supportedLocales = ["en", "he"] as const;
export const defaultLocale = "en";
export type Locale = (typeof supportedLocales)[number];

export const localeConfig = {
	supportedLocales,
	defaultLocale,
	rtlLocales: ["he"] as const,
} as const;

export type RTLLocale = (typeof localeConfig.rtlLocales)[number];

export function isRTLLocale(locale: string): locale is RTLLocale {
	return (localeConfig.rtlLocales as readonly string[]).includes(locale);
}

export function isSupportedLocale(locale: string): locale is Locale {
	return (supportedLocales as readonly string[]).includes(locale);
}
