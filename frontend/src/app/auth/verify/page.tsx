import { Icons } from "@/components/icons";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function VerifyPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<Icons.mail className="h-12 w-12 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold">Check your email</CardTitle>
					<CardDescription>
						We've sent you a magic link to sign in
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-sm text-muted-foreground">
						Click the link in the email we sent you to sign in to your account.
					</p>
					<p className="text-sm text-muted-foreground">
						If you don't see the email, check your spam folder.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
