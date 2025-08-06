"use client";

import { useTranslations } from "next-intl";
import { ApplianceSelector } from "@/components/ApplianceSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RoomManager } from "@/components/RoomManager";

export default function SettingsPage() {
	const t = useTranslations("settings");

	return (
		<div className="w-full min-h-screen bg-gray-50">
			<div className="max-w-md mx-auto px-4 py-6">
				<h1 className="text-2xl font-bold text-gray-800 mb-8">{t("title")}</h1>

				<div className="space-y-8">
					<LanguageSelector />
					<RoomManager />
					<ApplianceSelector />
				</div>
			</div>
		</div>
	);
}
