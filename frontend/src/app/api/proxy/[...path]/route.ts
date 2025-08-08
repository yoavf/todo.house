import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

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

	// Build the backend URL, preserving trailing slash behavior to avoid 307 redirects
	const baseBackendPath = `${API_URL}/api/${apiPath}`;
	const backendUrl = `${baseBackendPath}${originalHasTrailingSlash ? "/" : ""}${originalUrl.search}`;

	// Prepare headers
	const headers: HeadersInit = { Authorization: `Bearer ${token}` };

	// Forward content-type if present and not multipart
	const contentType = request.headers.get("content-type");
	if (contentType && !contentType.includes("multipart/form-data")) {
		headers["Content-Type"] = contentType;
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

		// Handle potential redirect from missing trailing slash on collection endpoints
		if (
			response.status === 307 ||
			response.status === 308 ||
			response.status === 301 ||
			response.status === 302
		) {
			const location = response.headers.get("location");
			if (location && requestOptions.method === "GET") {
				const redirectedUrl = location.startsWith("http")
					? location
					: `${API_URL}${location.startsWith("/") ? "" : "/"}${location}`;
				response = await fetch(redirectedUrl, requestOptions);
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

// Handle all HTTP methods
export async function GET(request: Request, context: any) {
	const { params } = context as { params: { path: string[] } };
	return handleRequest(request, "GET", {
		path: await Promise.resolve(params.path),
	});
}

export async function POST(request: Request, context: any) {
	const { params } = context as { params: { path: string[] } };
	return handleRequest(request, "POST", {
		path: await Promise.resolve(params.path),
	});
}

export async function PUT(request: Request, context: any) {
	const { params } = context as { params: { path: string[] } };
	return handleRequest(request, "PUT", {
		path: await Promise.resolve(params.path),
	});
}

export async function PATCH(request: Request, context: any) {
	const { params } = context as { params: { path: string[] } };
	return handleRequest(request, "PATCH", {
		path: await Promise.resolve(params.path),
	});
}

export async function DELETE(request: Request, context: any) {
	const { params } = context as { params: { path: string[] } };
	return handleRequest(request, "DELETE", {
		path: await Promise.resolve(params.path),
	});
}
