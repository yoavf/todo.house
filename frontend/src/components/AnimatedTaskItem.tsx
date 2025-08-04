"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedTaskItemProps {
	children: ReactNode;
	taskId: number;
	isRemoving: boolean;
	onAnimationComplete?: () => void;
}

// Animation timing constants (matching TaskItem)
const ANIMATION_TIMING = {
	slideOut: 0.3,
	heightCollapseDelay: 0.1,
} as const;

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
			duration: ANIMATION_TIMING.slideOut,
			ease: "easeInOut" as const,
			height: { delay: ANIMATION_TIMING.heightCollapseDelay },
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
