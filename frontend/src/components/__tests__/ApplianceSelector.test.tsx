import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { ApplianceSelector } from "../ApplianceSelector";

// Mock next-intl
jest.mock("next-intl", () => ({
	useTranslations: jest.fn(),
}));

describe("ApplianceSelector", () => {
	const mockT = jest.fn();
	const mockUseTranslations = useTranslations as jest.MockedFunction<
		typeof useTranslations
	>;

	beforeEach(() => {
		mockUseTranslations.mockReturnValue(mockT);
		mockT.mockImplementation((key: string) => {
			const translations: Record<string, string> = {
				title: "My Appliances",
				description: "Select the appliances you have in your home",
				refrigerator: "Refrigerator",
				washingMachine: "Washing Machine",
				microwave: "Microwave",
				oven: "Oven",
				dishwasher: "Dishwasher",
				dryer: "Dryer",
				airConditioner: "Air Conditioner",
				waterHeater: "Water Heater",
			};
			return translations[key] || key;
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders title and description", () => {
		render(<ApplianceSelector />);

		expect(screen.getByText("My Appliances")).toBeInTheDocument();
		expect(
			screen.getByText("Select the appliances you have in your home"),
		).toBeInTheDocument();
	});

	it("renders all appliance options", () => {
		render(<ApplianceSelector />);

		expect(screen.getByText("Refrigerator")).toBeInTheDocument();
		expect(screen.getByText("Washing Machine")).toBeInTheDocument();
		expect(screen.getByText("Microwave")).toBeInTheDocument();
		expect(screen.getByText("Oven")).toBeInTheDocument();
		expect(screen.getByText("Dishwasher")).toBeInTheDocument();
		expect(screen.getByText("Dryer")).toBeInTheDocument();
		expect(screen.getByText("Air Conditioner")).toBeInTheDocument();
		expect(screen.getByText("Water Heater")).toBeInTheDocument();
	});

	it("toggles appliance selection on click", () => {
		render(<ApplianceSelector />);

		const refrigeratorCard = screen.getByTestId("appliance-refrigerator");
		expect(refrigeratorCard).not.toHaveClass("bg-orange-50");

		fireEvent.click(refrigeratorCard);
		expect(refrigeratorCard).toHaveClass("bg-orange-50");

		fireEvent.click(refrigeratorCard);
		expect(refrigeratorCard).not.toHaveClass("bg-orange-50");
	});

	it("applies selection styles correctly", () => {
		render(<ApplianceSelector />);

		const microwaveCard = screen.getByTestId("appliance-microwave");
		const microwaveText = screen.getByText("Microwave");

		// Initially not selected
		expect(microwaveCard).toHaveClass("hover:bg-gray-50");
		expect(microwaveText).toHaveClass("text-gray-700");

		// After selection
		fireEvent.click(microwaveCard);
		expect(microwaveCard).toHaveClass("bg-orange-50", "border-orange-200");
		expect(microwaveText).toHaveClass("text-orange-900");
	});

	it("displays appliances in a 2-column grid", () => {
		render(<ApplianceSelector />);

		const gridContainer = screen.getByTestId(
			"appliance-refrigerator",
		).parentElement;
		expect(gridContainer).toHaveClass("grid", "grid-cols-2");
	});

	it("allows multiple appliance selections", () => {
		render(<ApplianceSelector />);

		const refrigeratorCard = screen.getByTestId("appliance-refrigerator");
		const ovenCard = screen.getByTestId("appliance-oven");

		fireEvent.click(refrigeratorCard);
		fireEvent.click(ovenCard);

		expect(refrigeratorCard).toHaveClass("bg-orange-50");
		expect(ovenCard).toHaveClass("bg-orange-50");
	});
});
