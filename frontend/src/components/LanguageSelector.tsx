"use client";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/contexts/LocaleContext";

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
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
					<GlobeIcon className="text-orange-500" size={16} />
				</div>
				<h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
			</div>

			<div className="bg-white rounded-lg overflow-hidden border border-gray-200">
				{languages.map((language, index) => (
					<button
						type="button"
						key={language.code}
						className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
							index < languages.length - 1 ? "border-b border-gray-200" : ""
						} ${
							locale === language.code ? "bg-orange-50" : "hover:bg-gray-100"
						}`}
						onClick={() => handleLanguageChange(language.code)}
					>
						<span
							className={`font-medium ${
								locale === language.code ? "text-orange-600" : "text-gray-700"
							}`}
						>
							{t(language.key)}
						</span>
						{locale === language.code && (
							<CheckIcon size={20} className="text-orange-600" />
						)}
					</button>
				))}
			</div>
		</div>
	);
}
