import { fireEvent, render, screen } from "@testing-library/react";
import { SnoozeModal } from "../SnoozeModal";

// Mock date-fns to have predictable dates
jest.mock("date-fns", () => ({
	format: jest.fn((date, format) => {
		if (format === "EEE HH:mm") {
			const dayMap: Record<number, string> = {
				0: "Sun",
				1: "Mon",
				2: "Tue",
				3: "Wed",
				4: "Thu",
				5: "Fri",
				6: "Sat",
			};
			return `${dayMap[date.getDay()]} 08:00`;
		}
		return date.toString();
	}),
	addDays: jest.fn((date, days) => {
		const newDate = new Date(date);
		newDate.setDate(newDate.getDate() + days);
		return newDate;
	}),
	nextMonday: jest.fn(() => {
		const date = new Date();
		date.setDate(date.getDate() + ((1 + 7 - date.getDay()) % 7 || 7));
		return date;
	}),
	nextSaturday: jest.fn(() => {
		const date = new Date();
		date.setDate(date.getDate() + ((6 + 7 - date.getDay()) % 7 || 7));
		return date;
	}),
}));

describe("SnoozeModal", () => {
	const mockOnClose = jest.fn();
	const mockOnSnooze = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders snooze options when open", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		expect(screen.getByText("Snooze until")).toBeInTheDocument();
		expect(screen.getByText("Tomorrow")).toBeInTheDocument();
		expect(screen.getByText("This weekend")).toBeInTheDocument();
		expect(screen.getByText("Next week")).toBeInTheDocument();
		expect(screen.getByText("Select date")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		render(
			<SnoozeModal
				isOpen={false}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		expect(screen.queryByText("Snooze until")).not.toBeInTheDocument();
	});

	it("calls onSnooze with correct date when Tomorrow is clicked", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		fireEvent.click(screen.getByText("Tomorrow"));

		expect(mockOnSnooze).toHaveBeenCalledTimes(1);
		const calledDate = mockOnSnooze.mock.calls[0][0];
		expect(calledDate).toBeInstanceOf(Date);
		expect(calledDate.getHours()).toBe(8);
		expect(calledDate.getMinutes()).toBe(0);
	});

	it("calls onSnooze with correct date when This weekend is clicked", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		fireEvent.click(screen.getByText("This weekend"));

		expect(mockOnSnooze).toHaveBeenCalledTimes(1);
		const calledDate = mockOnSnooze.mock.calls[0][0];
		expect(calledDate).toBeInstanceOf(Date);
		expect(calledDate.getHours()).toBe(8);
		expect(calledDate.getMinutes()).toBe(0);
	});

	it("calls onSnooze with correct date when Next week is clicked", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		fireEvent.click(screen.getByText("Next week"));

		expect(mockOnSnooze).toHaveBeenCalledTimes(1);
		const calledDate = mockOnSnooze.mock.calls[0][0];
		expect(calledDate).toBeInstanceOf(Date);
		expect(calledDate.getHours()).toBe(8);
		expect(calledDate.getMinutes()).toBe(0);
	});

	it("logs message when Select date is clicked", () => {
		const consoleSpy = jest.spyOn(console, "log").mockImplementation();

		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		fireEvent.click(screen.getByText("Select date"));

		expect(consoleSpy).toHaveBeenCalledWith("Date picker not implemented yet");
		expect(mockOnClose).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("calls onClose when Cancel button is clicked", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		fireEvent.click(screen.getByText("Cancel"));

		expect(mockOnClose).toHaveBeenCalledTimes(1);
		expect(mockOnSnooze).not.toHaveBeenCalled();
	});

	it("displays correct time descriptions", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
			/>,
		);

		// Check that time descriptions are displayed
		const timeElements = screen.getAllByText(/08:00/);
		expect(timeElements.length).toBeGreaterThan(0);
	});

	it("displays error message when error prop is provided", () => {
		const errorMessage = "Failed to snooze task";
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
				error={errorMessage}
			/>,
		);

		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it("does not display error message when error prop is null", () => {
		render(
			<SnoozeModal
				isOpen={true}
				onClose={mockOnClose}
				onSnooze={mockOnSnooze}
				error={null}
			/>,
		);

		expect(screen.queryByText(/Failed to snooze task/)).not.toBeInTheDocument();
	});
});
