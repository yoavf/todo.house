"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function AuthErrorPageInner() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	const errorMessages: Record<string, string> = {
		Configuration: "There is a problem with the server configuration.",
		AccessDenied: "You do not have permission to sign in.",
		Verification: "The verification link has expired or has already been used.",
		Default: "An unexpected error occurred.",
	};

	const errorMessage =
		errorMessages[error || "Default"] || errorMessages.Default;

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold">
						Authentication Error
					</CardTitle>
					<CardDescription>
						Something went wrong during authentication
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert variant="destructive">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>

					<div className="text-center">
						<Link href="/auth/signin">
							<Button>Try again</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function AuthErrorPage() {
	return (
		<Suspense fallback={<div className="min-h-screen" />}>
			<AuthErrorPageInner />
		</Suspense>
	);
}
