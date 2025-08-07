import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Hebrew } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import type { Locale } from "@/i18n/config";
import { getHTMLDirection } from "@/lib/locale-utils";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const notoSansHebrew = Noto_Sans_Hebrew({
	variable: "--font-noto-sans-hebrew",
	subsets: ["hebrew"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "TodoHouse",
	description: "Your home's best friend",
	manifest: "/manifest.json",
	themeColor: "#f97316",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "TodoHouse",
	},
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
		viewportFit: "cover",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Get locale and messages from next-intl
	const locale = (await getLocale()) as Locale;
	const messages = await getMessages();

	// Determine HTML direction based on locale
	const direction = getHTMLDirection(locale);

	return (
		<html lang={locale} dir={direction}>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${notoSansHebrew.variable} antialiased`}
			>
				<AuthSessionProvider>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<LocaleProvider>
							<main>{children}</main>
						</LocaleProvider>
					</NextIntlClientProvider>
				</AuthSessionProvider>
			</body>
		</html>
	);
}
