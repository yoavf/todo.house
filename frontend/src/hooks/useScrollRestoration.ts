"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface UseScrollRestorationOptions {
	/**
	 * Unique key to identify the scroll position in storage.
	 * Defaults to the current pathname.
	 */
	key?: string;
	/**
	 * Whether to save scroll position on route changes.
	 * Defaults to true.
	 */
	saveOnRouteChange?: boolean;
	/**
	 * Whether to restore scroll position on mount.
	 * Defaults to true.
	 */
	restoreOnMount?: boolean;
	/**
	 * Debounce time in milliseconds for saving scroll position.
	 * Defaults to 100ms.
	 */
	debounceMs?: number;
}

/**
 * Custom hook that preserves scroll position across navigation.
 * 
 * This hook automatically:
 * - Saves the current scroll position when the component unmounts or route changes
 * - Restores the saved scroll position when the component mounts
 * - Uses sessionStorage to persist across browser navigation
 * 
 * @param elementRef - Ref to the scrollable element (defaults to window)
 * @param options - Configuration options
 */
export function useScrollRestoration(
	elementRef?: React.RefObject<HTMLElement | null>,
	options: UseScrollRestorationOptions = {}
) {
	const {
		key,
		saveOnRouteChange = true,
		restoreOnMount = true,
		debounceMs = 100,
	} = options;

	const pathname = usePathname();
	const storageKey = key || `scroll-position-${pathname}`;
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const isRestoringRef = useRef(false);

	// Get the scrollable element (element or window)
	const getScrollElement = () => {
		return elementRef?.current || window;
	};

	// Get current scroll position
	const getScrollPosition = () => {
		const element = getScrollElement();
		if (element === window) {
			return {
				x: window.scrollX,
				y: window.scrollY,
			};
		}
		return {
			x: (element as HTMLElement).scrollLeft,
			y: (element as HTMLElement).scrollTop,
		};
	};

	// Set scroll position
	const setScrollPosition = (x: number, y: number) => {
		const element = getScrollElement();
		if (element === window) {
			window.scrollTo(x, y);
		} else {
			(element as HTMLElement).scrollLeft = x;
			(element as HTMLElement).scrollTop = y;
		}
	};

	// Save scroll position to sessionStorage
	const saveScrollPosition = () => {
		if (typeof window === "undefined") return;

		const position = getScrollPosition();
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(position));
		} catch (error) {
			// Silently fail if sessionStorage is not available
			console.warn("Failed to save scroll position:", error);
		}
	};

	// Debounced save function
	const debouncedSave = () => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(saveScrollPosition, debounceMs);
	};

	// Restore scroll position from sessionStorage
	const restoreScrollPosition = () => {
		if (typeof window === "undefined" || isRestoringRef.current) return;

		try {
			const saved = sessionStorage.getItem(storageKey);
			if (saved) {
				const position = JSON.parse(saved);
				isRestoringRef.current = true;
				
				// Use requestAnimationFrame to ensure DOM is ready
				requestAnimationFrame(() => {
					setScrollPosition(position.x, position.y);
					isRestoringRef.current = false;
				});
			}
		} catch (error) {
			// Silently fail if sessionStorage is not available or data is corrupted
			console.warn("Failed to restore scroll position:", error);
			isRestoringRef.current = false;
		}
	};

	// Clear saved scroll position
	const clearScrollPosition = () => {
		if (typeof window === "undefined") return;
		
		try {
			sessionStorage.removeItem(storageKey);
		} catch (error) {
			console.warn("Failed to clear scroll position:", error);
		}
	};

	// Effect to restore scroll position on mount
	useEffect(() => {
		if (restoreOnMount) {
			restoreScrollPosition();
		}
	}, [storageKey, restoreOnMount]);

	// Effect to save scroll position on scroll events
	useEffect(() => {
		const element = getScrollElement();
		
		if (element) {
			element.addEventListener("scroll", debouncedSave, { passive: true });
			
			return () => {
				element.removeEventListener("scroll", debouncedSave);
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
				}
			};
		}
	}, [elementRef?.current, storageKey]);

	// Effect to save scroll position on route changes
	useEffect(() => {
		if (saveOnRouteChange) {
			const handleRouteChange = () => {
				saveScrollPosition();
			};

			// Save position before route change
			window.addEventListener("beforeunload", handleRouteChange);
			
			return () => {
				window.removeEventListener("beforeunload", handleRouteChange);
				// Save position when effect cleans up (component unmount)
				saveScrollPosition();
			};
		}
	}, [pathname, saveOnRouteChange, storageKey]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			// Final save on unmount
			saveScrollPosition();
		};
	}, [storageKey]);

	return {
		saveScrollPosition,
		restoreScrollPosition,
		clearScrollPosition,
	};
}