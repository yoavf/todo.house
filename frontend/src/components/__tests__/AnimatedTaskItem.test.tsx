import { render, screen } from "@testing-library/react";
import { AnimatedTaskItem } from "../AnimatedTaskItem";

// Mock framer-motion
jest.mock("framer-motion", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock type for testing
	AnimatePresence: ({ children, onExitComplete }: any) => {
		// Simulate exit complete after a short delay when removing
		setTimeout(() => {
			if (onExitComplete) onExitComplete();
		}, 0);
		return <div data-testid="animate-presence">{children}</div>;
	},
	motion: {
		// biome-ignore lint/suspicious/noExplicitAny: Mock type for testing
		div: ({ children, ...props }: any) => (
			<div data-testid="motion-div" {...props}>
				{children}
			</div>
		),
	},
}));

describe("AnimatedTaskItem", () => {
	const mockOnAnimationComplete = jest.fn();
	const mockChild = <div data-testid="task-content">Task Content</div>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders children when not removing", () => {
		render(
			<AnimatedTaskItem
				taskId={1}
				isRemoving={false}
				onAnimationComplete={mockOnAnimationComplete}
			>
				{mockChild}
			</AnimatedTaskItem>,
		);

		expect(screen.getByTestId("task-content")).toBeInTheDocument();
		expect(screen.getByTestId("animate-presence")).toBeInTheDocument();
		expect(screen.getByTestId("motion-div")).toBeInTheDocument();
	});

	it("does not render children when removing", () => {
		render(
			<AnimatedTaskItem
				taskId={1}
				isRemoving={true}
				onAnimationComplete={mockOnAnimationComplete}
			>
				{mockChild}
			</AnimatedTaskItem>,
		);

		expect(screen.queryByTestId("task-content")).not.toBeInTheDocument();
		expect(screen.getByTestId("animate-presence")).toBeInTheDocument();
	});

	it("calls onAnimationComplete when animation completes", async () => {
		render(
			<AnimatedTaskItem
				taskId={1}
				isRemoving={false}
				onAnimationComplete={mockOnAnimationComplete}
			>
				{mockChild}
			</AnimatedTaskItem>,
		);

		// Wait for the mocked animation complete callback
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockOnAnimationComplete).toHaveBeenCalled();
	});

	it("handles animation completion without callback", () => {
		expect(() => {
			render(
				<AnimatedTaskItem taskId={1} isRemoving={false}>
					{mockChild}
				</AnimatedTaskItem>,
			);
		}).not.toThrow();
	});
});
