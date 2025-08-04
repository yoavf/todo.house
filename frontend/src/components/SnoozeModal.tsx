"use client";

import { addDays, format, nextMonday, nextSaturday } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
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
}

export function SnoozeModal({ isOpen, onClose, onSnooze }: SnoozeModalProps) {
	const now = new Date();

	const snoozeOptions = [
		{
			label: "Tomorrow",
			date: addDays(now, 1),
			icon: CalendarIcon,
			description: format(addDays(now, 1), "EEE HH:mm"),
		},
		{
			label: "This weekend",
			date: nextSaturday(now),
			icon: CalendarIcon,
			description: format(nextSaturday(now), "EEE HH:mm"),
		},
		{
			label: "Next week",
			date: nextMonday(now),
			icon: ClockIcon,
			description: format(nextMonday(now), "EEE HH:mm"),
		},
		{
			label: "Select date",
			date: null,
			icon: CalendarIcon,
			description: "and time",
		},
	];

	const handleSnoozeOption = (date: Date | null) => {
		if (date) {
			date.setHours(8, 0, 0, 0);
			onSnooze(date);
		} else {
			console.log("Date picker not implemented yet");
		}
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl font-normal">
						Snooze until
					</DialogTitle>
				</DialogHeader>
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
								<span className="font-medium text-base">{option.label}</span>
								<span className="text-sm text-gray-500">
									{option.description}
								</span>
							</button>
						);
					})}
				</div>
				<div className="mt-6">
					<Button variant="ghost" className="w-full" onClick={onClose}>
						Cancel
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
