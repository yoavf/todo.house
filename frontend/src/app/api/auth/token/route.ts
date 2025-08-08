import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * API route to get the NextAuth session token for the frontend to use with the backend API.
 * This is needed because the session token is in an httpOnly cookie that JavaScript can't access directly.
 */
export async function GET() {
	try {
		const cookieStore = await cookies();

		// NextAuth v5 uses these cookie names for the session token
		const sessionToken =
			cookieStore.get("authjs.session-token")?.value ||
			cookieStore.get("__Secure-authjs.session-token")?.value ||
			cookieStore.get("__Host-authjs.session-token")?.value;

		if (!sessionToken) {
			return NextResponse.json(
				{ error: "No session token found" },
				{ status: 401 },
			);
		}

		// Return the encrypted session token that the backend can decrypt
		return NextResponse.json({ token: sessionToken });
	} catch (error) {
		console.error("Error getting session token:", error);
		return NextResponse.json(
			{ error: "Failed to get session token" },
			{ status: 500 },
		);
	}
}
