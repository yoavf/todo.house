"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	AirConditionerIcon,
	DishwasherIcon,
	DryerIcon,
	MicrowaveIcon,
	OvenIcon,
	RefrigeratorIcon,
	WashingMachineIcon,
	WaterHeaterIcon,
} from "@/components/icons";
import { Card } from "./ui/card";

interface Appliance {
	id: string;
	name: ApplianceKey;
	icon: React.ComponentType<{ size?: number; className?: string }>;
}

type ApplianceKey =
	| "refrigerator"
	| "washingMachine"
	| "microwave"
	| "oven"
	| "dishwasher"
	| "dryer"
	| "airConditioner"
	| "waterHeater";

const APPLIANCES: Appliance[] = [
	{ id: "refrigerator", name: "refrigerator", icon: RefrigeratorIcon },
	{ id: "washing-machine", name: "washingMachine", icon: WashingMachineIcon },
	{ id: "microwave", name: "microwave", icon: MicrowaveIcon },
	{ id: "oven", name: "oven", icon: OvenIcon },
	{ id: "dishwasher", name: "dishwasher", icon: DishwasherIcon },
	{ id: "dryer", name: "dryer", icon: DryerIcon },
	{ id: "air-conditioner", name: "airConditioner", icon: AirConditionerIcon },
	{ id: "water-heater", name: "waterHeater", icon: WaterHeaterIcon },
];

export function ApplianceSelector() {
	const t = useTranslations("settings.appliances");
	const [selectedAppliances, setSelectedAppliances] = useState<Set<string>>(
		new Set(),
	);

	const toggleAppliance = (applianceId: string) => {
		const newSelected = new Set(selectedAppliances);
		if (newSelected.has(applianceId)) {
			newSelected.delete(applianceId);
		} else {
			newSelected.add(applianceId);
		}
		setSelectedAppliances(newSelected);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-3">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-orange-500"
					>
						<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
						<path d="m9 9 2 2 4-4" />
					</svg>
					<h2 className="text-lg font-semibold">{t("title")}</h2>
				</div>
				<p className="text-sm text-gray-600 ml-8">{t("description")}</p>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{APPLIANCES.map((appliance) => {
					const Icon = appliance.icon;
					const isSelected = selectedAppliances.has(appliance.id);

					return (
						<Card
							key={appliance.id}
							className={`p-4 cursor-pointer transition-all hover:shadow-md ${
								isSelected
									? "bg-orange-50 border-orange-200 shadow-sm"
									: "hover:bg-gray-50"
							}`}
							onClick={() => toggleAppliance(appliance.id)}
							data-testid={`appliance-${appliance.id}`}
						>
							<div className="flex flex-col items-center gap-3">
								<Icon
									size={32}
									className={isSelected ? "text-orange-500" : "text-gray-600"}
								/>
								<span
									className={`text-sm font-medium text-center leading-tight ${
										isSelected ? "text-orange-900" : "text-gray-700"
									}`}
								>
									{t(appliance.name)}
								</span>
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
