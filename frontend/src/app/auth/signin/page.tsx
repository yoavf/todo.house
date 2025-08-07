"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	const _t = useTranslations("auth");

	const handleEmailSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await signIn("resend", {
				email,
				callbackUrl: "/",
			});
		} catch (error) {
			console.error("Sign in error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true);
		try {
			await signIn("google", {
				callbackUrl: "/",
			});
		} catch (error) {
			console.error("Google sign in error:", error);
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Welcome to TodoHouse
					</CardTitle>
					<CardDescription className="text-center">
						Sign in to manage your home tasks
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>
								{error === "OAuthSignin" && "Error connecting to the provider"}
								{error === "OAuthCallback" && "Error during authentication"}
								{error === "OAuthCreateAccount" && "Could not create account"}
								{error === "EmailCreateAccount" && "Could not create account"}
								{error === "Callback" && "Error during sign in"}
								{error === "OAuthAccountNotLinked" &&
									"Email already exists with different provider"}
								{error === "EmailSignin" && "Error sending the email"}
								{error === "CredentialsSignin" &&
									"Sign in failed. Check your credentials"}
								{error === "SessionRequired" && "Please sign in to continue"}
								{error === "Default" && "An error occurred during sign in"}
							</AlertDescription>
						</Alert>
					)}

					<Button
						variant="outline"
						className="w-full"
						onClick={handleGoogleSignIn}
						disabled={isGoogleLoading}
					>
						{isGoogleLoading ? (
							<Icons.spinner className="me-2 h-4 w-4 animate-spin" />
						) : (
							<Icons.google className="me-2 h-4 w-4" />
						)}
						Continue with Google
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<form onSubmit={handleEmailSignIn} className="space-y-4">
						<Input
							type="email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={isLoading}
						/>
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading || !email}
						>
							{isLoading ? (
								<>
									<Icons.spinner className="me-2 h-4 w-4 animate-spin" />
									Sending magic link...
								</>
							) : (
								"Send magic link"
							)}
						</Button>
					</form>

					<p className="text-center text-sm text-muted-foreground">
						We'll send you a magic link to sign in
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
