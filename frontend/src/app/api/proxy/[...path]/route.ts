import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Ensure Node.js runtime for compatibility with NextAuth auth() and cookies()
export const runtime = "nodejs";
// Make sure this route is always dynamic so cookies are read per-request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Prefer explicit production API URL, with safe local fallback for dev
const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.API_URL ||
	"http://localhost:8000";

/**
 * Secure API proxy that handles authentication server-side.
 * This keeps the session token completely server-side and never exposes it to the client.
 *
 * All API requests go through this proxy:
 * - Frontend calls /api/proxy/tasks
 * - Proxy adds authentication and forwards to backend /api/tasks
 * - Response is returned to frontend
 *
 * This prevents XSS attacks from stealing session tokens since the token
 * never leaves the server.
 */

function parseCookieHeaderFor(
	names: string[],
	headerValue: string | null,
): string | null {
	if (!headerValue) return null;
	const pairs = headerValue.split(/;\s*/);
	const lookup: Record<string, string> = {};
	for (const pair of pairs) {
		const [rawKey, ...rest] = pair.split("=");
		const key = rawKey?.trim();
		if (!key) continue;
		lookup[key] = rest.join("=");
	}
	for (const name of names) {
		if (lookup[name]) return lookup[name];
	}
	return null;
}

async function getAuthToken(request: Request): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		// Try standard NextAuth cookie names first
		const names = [
			"authjs.session-token",
			"__Secure-authjs.session-token",
			"__Host-authjs.session-token",
		];
		for (const name of names) {
			const value = cookieStore.get(name)?.value;
			if (value) return value;
		}

		// Fallback: parse the Cookie header directly (defensive)
		const headerToken = parseCookieHeaderFor(
			names,
			request.headers.get("cookie"),
		);
		if (headerToken) return headerToken;

		return null;
	} catch (error) {
		console.error("Error getting auth token:", error);
		return null;
	}
}

async function handleRequest(
	request: Request,
	method: string,
	params: { path: string[] },
) {
	// Get the API path from the catch-all route
	const apiPath = params.path.join("/");
	const originalUrl = new URL(request.url);
	const originalHasTrailingSlash = originalUrl.pathname.endsWith("/");

	// Get auth token for backend
	const token = await getAuthToken(request);
	if (!token) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}

	// Build the backend URL, avoiding FastAPI 307 redirects on collection endpoints
	const isTopLevelCollection = !apiPath.includes("/");
	const mustHaveTrailingSlash = isTopLevelCollection;
	const baseBackendPath = `${API_URL}/api/${apiPath}`;
	const backendUrl = `${baseBackendPath}${
		mustHaveTrailingSlash || originalHasTrailingSlash ? "/" : ""
	}${originalUrl.search}`;
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("[Proxy] Backend request", { backendUrl });
	}

	// Prepare headers
	const headers: HeadersInit = { Authorization: `Bearer ${token}` };

	// Forward content-type if present and not multipart
	const contentType = request.headers.get("content-type");
	if (contentType && !contentType.includes("multipart/form-data")) {
		headers["Content-Type"] = contentType;
	}

	// Forward Accept header for content negotiation
	const acceptHeader = request.headers.get("accept");
	if (acceptHeader) {
		headers["Accept"] = acceptHeader;
	}

	// Prepare the request options
	const requestOptions: RequestInit = {
		method,
		headers,
	};

	// Forward body for methods that support it
	if (["POST", "PUT", "PATCH"].includes(method)) {
		if (contentType?.includes("multipart/form-data")) {
			// For multipart, forward the FormData directly
			requestOptions.body = await request.formData();
		} else if (contentType?.includes("application/json")) {
			// For JSON, forward as-is
			requestOptions.body = await request.text();
		} else {
			// Default to text
			requestOptions.body = await request.text();
		}
	}

	try {
		// Make the request to the backend
		let response = await fetch(backendUrl, requestOptions);
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("[Proxy] First response status", { status: response.status });
		}

		// Handle potential redirect from missing trailing slash on collection endpoints
		if (
			response.status === 307 ||
			response.status === 308 ||
			response.status === 301 ||
			response.status === 302
		) {
			const location = response.headers.get("location");
			if (location) {
				// 307 and 308 must preserve method and body for all HTTP methods
				// 301 and 302 traditionally only follow for GET (may change method to GET for others)
				const shouldFollowRedirect =
					response.status === 307 ||
					response.status === 308 ||
					requestOptions.method === "GET";

				if (shouldFollowRedirect) {
					const redirectedUrl = location.startsWith("http")
						? location
						: `${API_URL}${location.startsWith("/") ? "" : "/"}${location}`;
					if (process.env.NODE_ENV === "development") {
						// eslint-disable-next-line no-console
						console.log("[Proxy] Following redirect", {
							redirectedUrl,
							status: response.status,
							method: requestOptions.method,
						});
					}
					response = await fetch(redirectedUrl, requestOptions);
				}
			}
		}

		// Create response with same status and headers
		const responseHeaders = new Headers();

		// Forward relevant headers from backend
		const headersToForward = [
			"content-type",
			"content-length",
			"cache-control",
			"content-disposition",
			"location",
		];

		headersToForward.forEach((header) => {
			const value = response.headers.get(header);
			if (value) {
				responseHeaders.set(header, value);
			}
		});

		// Return the response
		return new NextResponse(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ error: "Failed to connect to backend" },
			{ status: 502 },
		);
	}
}

// Type for Next.js route handler context with catch-all params
type RouteContext = {
	params: Promise<{ path: string[] }>;
};

// Handle all HTTP methods
export async function GET(request: Request, context: RouteContext) {
	const params = await context.params;
	return handleRequest(request, "GET", {
		path: params.path,
	});
}

export async function POST(request: Request, context: RouteContext) {
	const params = await context.params;
	return handleRequest(request, "POST", {
		path: params.path,
	});
}

export async function PUT(request: Request, context: RouteContext) {
	const params = await context.params;
	return handleRequest(request, "PUT", {
		path: params.path,
	});
}

export async function PATCH(request: Request, context: RouteContext) {
	const params = await context.params;
	return handleRequest(request, "PATCH", {
		path: params.path,
	});
}

export async function DELETE(request: Request, context: RouteContext) {
	const params = await context.params;
	return handleRequest(request, "DELETE", {
		path: params.path,
	});
}
