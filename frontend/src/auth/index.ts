import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const authConfig: NextAuthConfig = {
	providers: [
		Google({
			clientId: process.env.AUTH_GOOGLE_ID || "",
			clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
		}),
		Resend({
			from: process.env.AUTH_EMAIL_FROM || "noreply@todohouse.app",
			apiKey: process.env.AUTH_RESEND_KEY || "",
		}),
	],
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
