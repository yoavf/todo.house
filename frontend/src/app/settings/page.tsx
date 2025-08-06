"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApplianceSelector } from "@/components/ApplianceSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RoomManager } from "@/components/RoomManager";

export default function SettingsPage() {
	const t = useTranslations("settings");
	const router = useRouter();

	const handleClose = () => {
		router.back();
	};

	return (
		<div
			className="w-full min-h-screen"
			style={{ backgroundColor: "rgb(240, 240, 243)" }}
		>
			<div
				className="max-w-md mx-auto min-h-screen shadow-sm relative"
				style={{ backgroundColor: "rgb(249, 250, 251)" }}
			>
				<div className="px-4 py-6">
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
						<button
							type="button"
							onClick={handleClose}
							className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Close settings"
						>
							<XIcon size={24} />
						</button>
					</div>

					<div className="space-y-8">
						<LanguageSelector />
						<RoomManager />
						<ApplianceSelector />
					</div>
				</div>
			</div>
		</div>
	);
}
