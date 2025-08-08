import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

// Validate OAuth providers configuration at startup
const providers: NextAuthConfig["providers"] = [];

// Google OAuth configuration
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
	providers.push(
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
		}),
	);
} else if (process.env.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_SECRET) {
	// If one is set but not the other, this is likely a configuration error
	throw new Error(
		"Google OAuth configuration error: Both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set, or neither. " +
			"Currently only one is configured.",
	);
}

// Resend email provider configuration
if (process.env.AUTH_RESEND_KEY) {
	providers.push(
		Resend({
			from: process.env.AUTH_EMAIL_FROM || "noreply@todohouse.app",
			apiKey: process.env.AUTH_RESEND_KEY,
		}),
	);
}

// Ensure at least one authentication provider is configured
if (providers.length === 0) {
	throw new Error(
		"No authentication providers configured. " +
			"Please configure at least one authentication method:\n" +
			"- For Google OAuth: Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET\n" +
			"- For Email (Resend): Set AUTH_RESEND_KEY",
	);
}

export const authConfig: NextAuthConfig = {
	providers,
	pages: {
		signIn: "/auth/signin",
		error: "/auth/error",
		verifyRequest: "/auth/verify",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
				token.picture = user.image;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
	},
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
