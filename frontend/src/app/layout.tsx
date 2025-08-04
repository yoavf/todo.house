import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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

export const metadata: Metadata = {
	title: "TodoHouse",
	description: "Your home's best friend",
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
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<LocaleProvider>
						<main>{children}</main>
					</LocaleProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
