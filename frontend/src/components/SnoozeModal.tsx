"use client";

import { addDays, format, nextMonday, nextSaturday } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface SnoozeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSnooze: (date: Date) => void;
	error?: string | null;
}

export function SnoozeModal({
	isOpen,
	onClose,
	onSnooze,
	error,
}: SnoozeModalProps) {
	const now = new Date();
	const t = useTranslations();

	const snoozeOptions = [
		{
			label: t("time.tomorrow"),
			date: addDays(now, 1),
			icon: CalendarIcon,
			description: format(addDays(now, 1), "EEE HH:mm"),
		},
		{
			label: t("time.thisWeekend"),
			date: nextSaturday(now),
			icon: CalendarIcon,
			description: format(nextSaturday(now), "EEE HH:mm"),
		},
		{
			label: t("time.nextWeek"),
			date: nextMonday(now),
			icon: ClockIcon,
			description: format(nextMonday(now), "EEE HH:mm"),
		},
		{
			label: t("common.selectDate"),
			date: null,
			icon: CalendarIcon,
			description: t("time.andTime"),
		},
	];

	const handleSnoozeOption = (date: Date | null) => {
		if (date) {
			const snoozeDate = new Date(date);
			snoozeDate.setHours(8, 0, 0, 0);
			onSnooze(snoozeDate);
		} else {
			console.log("Date picker not implemented yet");
		}
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl font-normal text-start">
						{t("tasks.actions.snoozeTask")}
					</DialogTitle>
				</DialogHeader>
				{error && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-sm text-red-600 text-start">{error}</p>
					</div>
				)}
				<div className="grid grid-cols-2 gap-4 mt-6">
					{snoozeOptions.map((option) => {
						const Icon = option.icon;
						return (
							<button
								type="button"
								key={option.label}
								onClick={() => handleSnoozeOption(option.date)}
								className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
							>
								<Icon className="h-8 w-8 text-orange-500 mb-2" />
								<span className="font-medium text-base text-center">
									{option.label}
								</span>
								<span className="text-sm text-gray-500 text-center">
									{option.description}
								</span>
							</button>
						);
					})}
				</div>
				<div className="mt-6">
					<Button variant="ghost" className="w-full" onClick={onClose}>
						{t("common.cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
