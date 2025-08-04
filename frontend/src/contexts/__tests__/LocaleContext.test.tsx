import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { LocaleProvider, useLocaleContext, useIsRTL, useDirection } from "../LocaleContext";

// Mock next-intl's useLocale hook
jest.mock("next-intl", () => ({
	NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	useLocale: jest.fn(),
}));

const mockUseLocale = jest.mocked(jest.requireMock("next-intl").useLocale);

// Test component that uses the locale context
function TestComponent() {
	const { locale, isRTL, direction } = useLocaleContext();
	const isRTLHook = useIsRTL();
	const directionHook = useDirection();

	return (
		<div>
			<div data-testid="locale">{locale}</div>
			<div data-testid="isRTL">{isRTL.toString()}</div>
			<div data-testid="direction">{direction}</div>
			<div data-testid="isRTL-hook">{isRTLHook.toString()}</div>
			<div data-testid="direction-hook">{directionHook}</div>
		</div>
	);
}

// Mock messages for testing
const mockMessages = {
	common: {
		test: "Test message",
	},
};

describe("LocaleContext", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should provide English locale context", () => {
		mockUseLocale.mockReturnValue("en");

		render(
			<NextIntlClientProvider locale="en" messages={mockMessages}>
				<LocaleProvider>
					<TestComponent />
				</LocaleProvider>
			</NextIntlClientProvider>
		);

		expect(screen.getByTestId("locale")).toHaveTextContent("en");
		expect(screen.getByTestId("isRTL")).toHaveTextContent("false");
		expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
		expect(screen.getByTestId("isRTL-hook")).toHaveTextContent("false");
		expect(screen.getByTestId("direction-hook")).toHaveTextContent("ltr");
	});

	it("should provide Hebrew locale context", () => {
		mockUseLocale.mockReturnValue("he");

		render(
			<NextIntlClientProvider locale="he" messages={mockMessages}>
				<LocaleProvider>
					<TestComponent />
				</LocaleProvider>
			</NextIntlClientProvider>
		);

		expect(screen.getByTestId("locale")).toHaveTextContent("he");
		expect(screen.getByTestId("isRTL")).toHaveTextContent("true");
		expect(screen.getByTestId("direction")).toHaveTextContent("rtl");
		expect(screen.getByTestId("isRTL-hook")).toHaveTextContent("true");
		expect(screen.getByTestId("direction-hook")).toHaveTextContent("rtl");
	});

	it("should throw error when used outside provider", () => {
		mockUseLocale.mockReturnValue("en");

		// Suppress console.error for this test
		const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow("useLocaleContext must be used within a LocaleProvider");

		consoleSpy.mockRestore();
	});
});