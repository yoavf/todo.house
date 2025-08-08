/**
 * Client-side API fetch wrapper
 *
 * SECURITY: This file has been updated to use a secure server-side proxy
 * for all API calls. The session token is never exposed to client-side
 * JavaScript, preventing XSS attacks from stealing authentication credentials.
 *
 * All API calls go through /api/proxy/* which handles authentication server-side.
 */

// Use secure proxy instead of direct API calls
const API_PROXY_URL = "/api/proxy";

interface FetchOptions extends RequestInit {
	requireAuth?: boolean;
}

/**
 * Client-side fetch wrapper for use in React components
 * Uses secure server-side proxy that handles authentication
 * The session token never leaves the server, preventing XSS attacks
 */
export async function authenticatedFetch(
	url: string,
	options: FetchOptions = {},
): Promise<Response> {
	const { requireAuth = true, headers = {}, ...rest } = options;

	// Build headers
	const requestHeaders: Record<string, string> = {
		...(headers as Record<string, string>),
	};

	// Only set Content-Type if not already set and not FormData
	if (!requestHeaders["Content-Type"] && !(rest.body instanceof FormData)) {
		requestHeaders["Content-Type"] = "application/json";
	}

	// Use the secure proxy endpoint
	// The proxy handles authentication server-side
	const response = await fetch(`${API_PROXY_URL}${url}`, {
		...rest,
		headers: requestHeaders,
		// Include credentials for same-origin requests
		credentials: "same-origin",
	});

	// Handle auth errors
	if (response.status === 401 && requireAuth) {
		// Session might be expired, trigger re-authentication
		window.location.href = "/auth/signin";
		throw new Error("Authentication required");
	}

	return response;
}
