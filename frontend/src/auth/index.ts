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
// Note: Email authentication requires a database adapter to store verification tokens
// Uncomment this when a database adapter is configured
// if (process.env.AUTH_RESEND_KEY) {
// 	providers.push(
// 		Resend({
// 			from: process.env.AUTH_EMAIL_FROM || "noreply@todohouse.app",
// 			apiKey: process.env.AUTH_RESEND_KEY,
// 		}),
// 	);
// }

// Ensure at least one authentication provider is configured
if (providers.length === 0) {
	throw new Error(
		"No authentication providers configured. " +
			"Please configure at least one authentication method:\n" +
			"- For Google OAuth: Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET\n" +
			"  Get these from: https://console.cloud.google.com/apis/credentials\n" +
			"- For Email (Resend): Requires a database adapter (not yet configured)",
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
		async jwt({ token, user, account }) {
			// Initial sign in
			if (account && user) {
				// Use the provider account ID as the user ID if no user.id exists
				token.sub = user.id || account.providerAccountId;
				token.id = user.id || account.providerAccountId;
				token.email = user.email;
				token.name = user.name;
				token.picture = user.image;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token) {
				session.user.id = (token.id as string) || (token.sub as string);
			}
			return session;
		},
		async signIn({ user, account, profile }) {
			// Allow sign in
			return true;
		},
		async redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
	},
	session: {
		strategy: "jwt",
	},
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
