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
	const { isRTL } = useLocale();

	return {
		// Tailwind's logical properties work automatically with dir="rtl"
		// These are just helper functions for convenience

		// Icon mirroring utilities
		mirrorIcon: (shouldMirror = true) =>
			shouldMirror && isRTL ? "scale-x-[-1]" : "",
		conditionalMirror: "rtl:scale-x-[-1]",

		// Flex direction utilities
		flexRowReverseRTL: "flex-row-reverse-rtl",

		// Utility to combine classes
		combine: (baseClasses: string, rtlClasses?: string) =>
			rtlClasses && isRTL ? `${baseClasses} ${rtlClasses}` : baseClasses,

		// Helper to get directional arrow icon
		getArrowIcon: () => (isRTL ? "ArrowLeftIcon" : "ArrowRightIcon"),

		// Helper to get back arrow icon
		getBackArrowIcon: () => (isRTL ? "ArrowRightIcon" : "ArrowLeftIcon"),

		// Helper to get chevron icon
		getChevronIcon: () => (isRTL ? "ChevronLeftIcon" : "ChevronRightIcon"),

		// Helper for swipe directions
		getSwipeDirection: () => ({
			positive: isRTL ? "left" : "right",
			negative: isRTL ? "right" : "left",
		}),

		// Helper to apply RTL mirroring class to any directional icon
		getMirrorClass: (shouldMirror = true) =>
			shouldMirror && isRTL ? "rtl:scale-x-[-1]" : "",
	};
}
