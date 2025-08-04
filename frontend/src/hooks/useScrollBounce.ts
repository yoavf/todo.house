"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseScrollBounceOptions {
	/**
	 * The element to attach scroll listeners to. Defaults to window.
	 */
	target?: HTMLElement | Window | null;
	/**
	 * The threshold in pixels to trigger bounce effect when scrolling beyond edges
	 */
	threshold?: number;
	/**
	 * Duration of the bounce animation in milliseconds
	 */
	duration?: number;
}

interface ScrollBounceState {
	/**
	 * Whether currently bouncing at the top edge
	 */
	isBouncingTop: boolean;
	/**
	 * Whether currently bouncing at the bottom edge
	 */
	isBouncingBottom: boolean;
	/**
	 * CSS transform value for the bounce effect
	 */
	transform: string;
}

/**
 * Custom hook to add bounce effects when scrolling beyond edges
 * Provides native iOS-like bounce behavior for web scrolling
 */
export function useScrollBounce({
	target = typeof window !== "undefined" ? window : null,
	threshold = 10,
	duration = 300,
}: UseScrollBounceOptions = {}): ScrollBounceState {
	const [bounceState, setBounceState] = useState<ScrollBounceState>({
		isBouncingTop: false,
		isBouncingBottom: false,
		transform: "",
	});

	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const lastScrollTop = useRef(0);
	const isScrolling = useRef(false);

	const triggerBounce = useCallback(
		(direction: "top" | "bottom") => {
			const bounceAmount = direction === "top" ? 15 : -15;

			// Clear any existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Set bounce state
			setBounceState({
				isBouncingTop: direction === "top",
				isBouncingBottom: direction === "bottom",
				transform: `translateY(${bounceAmount}px)`,
			});

			// Reset after animation
			timeoutRef.current = setTimeout(() => {
				setBounceState({
					isBouncingTop: false,
					isBouncingBottom: false,
					transform: "",
				});
			}, duration);
		},
		[duration],
	);

	const handleScroll = useCallback(() => {
		if (!target) return;

		const scrollElement =
			target === window ? document.documentElement : (target as HTMLElement);
		const scrollTop =
			target === window ? window.scrollY : (target as HTMLElement).scrollTop;
		const scrollHeight = scrollElement.scrollHeight;
		const clientHeight =
			target === window
				? window.innerHeight
				: (target as HTMLElement).clientHeight;

		// Check if at top edge and trying to scroll up
		if (scrollTop <= 0 && lastScrollTop.current > scrollTop) {
			if (!bounceState.isBouncingTop && !isScrolling.current) {
				triggerBounce("top");
			}
		}

		// Check if at bottom edge and trying to scroll down
		const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
		if (isAtBottom && lastScrollTop.current < scrollTop) {
			if (!bounceState.isBouncingBottom && !isScrolling.current) {
				triggerBounce("bottom");
			}
		}

		lastScrollTop.current = scrollTop;

		// Debounce scrolling state
		isScrolling.current = true;
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			isScrolling.current = false;
		}, 150);
	}, [
		target,
		threshold,
		triggerBounce,
		bounceState.isBouncingTop,
		bounceState.isBouncingBottom,
	]);

	useEffect(() => {
		if (!target) return;

		target.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			target.removeEventListener("scroll", handleScroll);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [target, handleScroll]);

	return bounceState;
}
