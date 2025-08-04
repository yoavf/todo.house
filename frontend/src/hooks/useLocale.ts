import { useLocale as useNextIntlLocale } from "next-intl";
import type { Locale } from "@/i18n/config";
import { createLocaleContext } from "@/lib/locale-utils";

/**
 * Hook to get current locale with RTL context
 */
export function useLocale() {
	const locale = useNextIntlLocale() as Locale;
	return createLocaleContext(locale);
}

/**
 * Hook to get RTL-aware CSS classes using Tailwind's logical properties
 */
export function useRTLClasses() {
	const { locale, isRTL } = useLocale();

	return {
		// Tailwind's logical properties work automatically with dir="rtl"
		// These are just helper functions for convenience

		// Icon mirroring utilities
		mirrorIcon: (shouldMirror = true) =>
			shouldMirror && isRTL ? "rtl-mirror" : "",
		conditionalMirror: "rtl:mirror",

		// Flex direction utilities
		flexRowReverseRTL: "flex-row-reverse-rtl",

		// Utility to combine classes
		combine: (baseClasses: string, rtlClasses?: string) =>
			rtlClasses && isRTL ? `${baseClasses} ${rtlClasses}` : baseClasses,

		// Helper to get directional arrow icon
		getArrowIcon: () => (isRTL ? "ArrowLeftIcon" : "ArrowRightIcon"),

		// Helper for swipe directions
		getSwipeDirection: () => ({
			positive: isRTL ? "left" : "right",
			negative: isRTL ? "right" : "left",
		}),
	};
}
