"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedTaskItemProps {
	children: ReactNode;
	taskId: number;
	isRemoving: boolean;
	onAnimationComplete?: () => void;
}

const exitVariants = {
	initial: { opacity: 1, x: 0, height: "auto" },
	exit: {
		opacity: 0,
		x: -300,
		height: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
		transition: {
			duration: 0.3,
			ease: "easeInOut" as const,
			height: { delay: 0.1 },
		},
	},
};

export function AnimatedTaskItem({
	children,
	taskId,
	isRemoving,
	onAnimationComplete,
}: AnimatedTaskItemProps) {
	return (
		<AnimatePresence mode="wait" onExitComplete={onAnimationComplete}>
			{!isRemoving && (
				<motion.div
					key={taskId}
					initial="initial"
					exit="exit"
					variants={exitVariants}
					layout
					className="mb-4"
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
