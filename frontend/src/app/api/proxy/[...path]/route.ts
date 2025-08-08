import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

async function getAuthToken(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		// NextAuth v5 session token (encrypted JWT)
		const sessionToken =
			cookieStore.get("authjs.session-token")?.value ||
			cookieStore.get("__Secure-authjs.session-token")?.value ||
			cookieStore.get("__Host-authjs.session-token")?.value;

		return sessionToken || null;
	} catch (error) {
		console.error("Error getting auth token:", error);
		return null;
	}
}

async function handleRequest(
	request: NextRequest,
	method: string,
	params: { path: string[] },
) {
	// Check if user is authenticated
	const session = await auth();
	if (!session) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}

	// Get the API path from the catch-all route
	const apiPath = params.path.join("/");

	// Get auth token for backend
	const token = await getAuthToken();
	if (!token) {
		return NextResponse.json(
			{ error: "No session token available" },
			{ status: 401 },
		);
	}

	// Build the backend URL
	const backendUrl = `${API_URL}/api/${apiPath}${request.nextUrl.search}`;

	// Prepare headers
	const headers: HeadersInit = {
		Authorization: `Bearer ${token}`,
	};

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
		const response = await fetch(backendUrl, requestOptions);

		// Create response with same status and headers
		const responseHeaders = new Headers();

		// Forward relevant headers from backend
		const headersToForward = [
			"content-type",
			"content-length",
			"cache-control",
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
export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } },
) {
	return handleRequest(request, "GET", {
		path: await Promise.resolve(params.path),
	});
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { path: string[] } },
) {
	return handleRequest(request, "POST", {
		path: await Promise.resolve(params.path),
	});
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { path: string[] } },
) {
	return handleRequest(request, "PUT", {
		path: await Promise.resolve(params.path),
	});
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { path: string[] } },
) {
	return handleRequest(request, "PATCH", {
		path: await Promise.resolve(params.path),
	});
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { path: string[] } },
) {
	return handleRequest(request, "DELETE", {
		path: await Promise.resolve(params.path),
	});
}
