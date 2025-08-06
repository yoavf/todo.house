"use client";

import { GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/contexts/LocaleContext";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type LanguageKey = "english" | "hebrew";

const languages: Array<{ code: string; key: LanguageKey }> = [
	{ code: "en", key: "english" },
	{ code: "he", key: "hebrew" },
];

export function LanguageSelector() {
	const router = useRouter();
	const t = useTranslations("settings.language");
	const { locale } = useLocaleContext();

	const handleLanguageChange = (newLocale: string) => {
		// Update the locale via cookie and refresh
		document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
		router.refresh();
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<GlobeIcon className="text-orange-500" size={20} />
				<h2 className="text-lg font-semibold">{t("title")}</h2>
			</div>

			<Card className="divide-y divide-gray-100">
				{languages.map((language) => (
					<div key={language.code} className="p-0">
						<Button
							variant="ghost"
							className={`w-full justify-start h-12 px-4 rounded-none first:rounded-t-md last:rounded-b-md ${
								locale === language.code
									? "bg-orange-50 text-orange-600 hover:bg-orange-50"
									: "text-gray-700 hover:bg-gray-50"
							}`}
							onClick={() => handleLanguageChange(language.code)}
						>
							<span className="font-medium">{t(language.key)}</span>
							{locale === language.code && (
								<span className="mr-auto">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
										<path
											d="M13.207 5.207a1 1 0 0 0-1.414-1.414L6.5 9.086 4.207 6.793a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l6-6z"
											fill="currentColor"
										/>
									</svg>
								</span>
							)}
						</Button>
					</div>
				))}
			</Card>
		</div>
	);
}
