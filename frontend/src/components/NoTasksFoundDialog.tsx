"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface NoTasksFoundDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onAddManually: () => void;
}

const NoTasksFoundDialog: React.FC<NoTasksFoundDialogProps> = ({
	isOpen,
	onClose,
	onAddManually,
}) => {
	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>No Tasks Found</DialogTitle>
					<DialogDescription>
						We couldn't find any tasks in the image. You can add a task
						manually.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={onClose}>
						OK
					</Button>
					<Button onClick={onAddManually}>Add Manually</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default NoTasksFoundDialog;
