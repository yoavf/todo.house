"use client";

import { Bell } from "lucide-react";
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
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
						<Bell className="text-orange-500" size={16} />
					</div>
					<h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
				</div>
				<p className="text-sm text-gray-600 ml-10">{t("description")}</p>
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
