import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

/**
 * Get the current session and redirect to sign in if not authenticated
 */
export async function requireAuth() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/auth/signin");
	}

	return session;
}

/**
 * Get the current session without redirecting
 */
export async function getOptionalAuth() {
	return await getServerSession(authOptions);
}
