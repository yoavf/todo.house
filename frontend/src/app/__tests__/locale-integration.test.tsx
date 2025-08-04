/**
 * Integration test for locale detection and HTML direction setting
 */

import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import {
	LocaleProvider,
	useDirection,
	useIsRTL,
	useLocaleContext,
} from "@/contexts/LocaleContext";

// Test component that uses the locale context
function TestLocaleComponent() {
	const { locale, isRTL, direction } = useLocaleContext();
	const isRTLHook = useIsRTL();
	const directionHook = useDirection();

	return (
		<div className="p-4 border rounded-lg space-y-2">
			<h3 className="text-lg font-semibold">Locale Information</h3>
			<div className="grid grid-cols-2 gap-2 text-sm">
				<div>
					<strong>Current Locale:</strong> {locale}
				</div>
				<div>
					<strong>Is RTL:</strong> {isRTL.toString()}
				</div>
				<div>
					<strong>Direction:</strong> {direction}
				</div>
				<div>
					<strong>RTL Hook:</strong> {isRTLHook.toString()}
				</div>
				<div>
					<strong>Direction Hook:</strong> {directionHook}
				</div>
			</div>
		</div>
	);
}

// Mock next-intl's useLocale hook
jest.mock("next-intl", () => ({
	NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	useLocale: jest.fn(),
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			"common.delete": "Delete",
			"common.cancel": "Cancel",
			"time.tomorrow": "Tomorrow",
			"tasks.priority.high": "High",
		};
		return translations[key] || key;
	},
}));

const mockUseLocale = jest.mocked(jest.requireMock("next-intl").useLocale);

describe("Locale Integration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render LocaleDemo with English locale context", () => {
		mockUseLocale.mockReturnValue("en");

		const { getByText, getAllByText } = render(
			<NextIntlClientProvider locale="en" messages={{}}>
				<LocaleProvider>
					<TestLocaleComponent />
				</LocaleProvider>
			</NextIntlClientProvider>,
		);

		expect(getByText("en")).toBeInTheDocument();
		expect(getAllByText("false")).toHaveLength(2); // Is RTL and RTL Hook
		expect(getAllByText("ltr")).toHaveLength(2); // Direction and Direction Hook
		expect(getByText("Locale Information")).toBeInTheDocument();
	});

	it("should render LocaleDemo with Hebrew locale context", () => {
		mockUseLocale.mockReturnValue("he");

		const { getByText, getAllByText } = render(
			<NextIntlClientProvider locale="he" messages={{}}>
				<LocaleProvider>
					<TestLocaleComponent />
				</LocaleProvider>
			</NextIntlClientProvider>,
		);

		expect(getByText("he")).toBeInTheDocument();
		expect(getAllByText("true")).toHaveLength(2); // Is RTL and RTL Hook
		expect(getAllByText("rtl")).toHaveLength(2); // Direction and Direction Hook
		expect(getByText("Locale Information")).toBeInTheDocument();
	});
});
