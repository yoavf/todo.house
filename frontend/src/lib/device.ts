export function isMobileDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	// Check for touch capability
	const hasTouch =
		"ontouchstart" in window ||
		navigator.maxTouchPoints > 0 ||
		// @ts-expect-error - msMaxTouchPoints is deprecated but might exist
		navigator.msMaxTouchPoints > 0;

	// Check screen size for tablets and phones
	const isMobileWidth = window.innerWidth <= 768;

	// Check if device has camera access (more reliable than user agent)
	const hasMediaDevices =
		"mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;

	// Use user agent as fallback
	const mobileUserAgent =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	// Consider it mobile if it has touch AND (small screen OR mobile user agent)
	return hasTouch && (isMobileWidth || mobileUserAgent) && hasMediaDevices;
}

export function hasCameraSupport(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		"mediaDevices" in navigator &&
		"getUserMedia" in navigator.mediaDevices &&
		// Check if we're in a secure context (required for camera access)
		window.isSecureContext
	);
}

export function isTouchDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		"ontouchstart" in window ||
		navigator.maxTouchPoints > 0 ||
		// @ts-expect-error - msMaxTouchPoints is deprecated but might exist
		navigator.msMaxTouchPoints > 0
	);
}
