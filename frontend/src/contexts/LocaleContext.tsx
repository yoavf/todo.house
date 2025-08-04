"use client";

import { useLocale } from "next-intl";
import React, { createContext, type ReactNode, useContext } from "react";
import { createLocaleContext } from "@/lib/locale-utils";
import type {
	Locale,
	LocaleContext as LocaleContextType,
} from "@/types/locale";

const LocaleContext = createContext<LocaleContextType | null>(null);

interface LocaleProviderProps {
	children: ReactNode;
}

/**
 * Client-side locale context provider that wraps next-intl's locale
 * with additional RTL and direction information
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
	const locale = useLocale() as Locale;
	const localeContext = createLocaleContext(locale);

	return (
		<LocaleContext.Provider value={localeContext}>
			{children}
		</LocaleContext.Provider>
	);
}

/**
 * Hook to access locale context with RTL and direction information
 */
export function useLocaleContext(): LocaleContextType {
	const context = useContext(LocaleContext);

	if (!context) {
		throw new Error("useLocaleContext must be used within a LocaleProvider");
	}

	return context;
}

/**
 * Hook to check if current locale is RTL
 */
export function useIsRTL(): boolean {
	const { isRTL } = useLocaleContext();
	return isRTL;
}

/**
 * Hook to get HTML direction for current locale
 */
export function useDirection(): "ltr" | "rtl" {
	const { direction } = useLocaleContext();
	return direction;
}
