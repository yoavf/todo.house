import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/contexts/LocaleContext";
import { LanguageSelector } from "../LanguageSelector";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
	useTranslations: jest.fn(),
}));

// Mock LocaleContext
jest.mock("@/contexts/LocaleContext", () => ({
	useLocaleContext: jest.fn(),
}));

describe("LanguageSelector", () => {
	const mockRefresh = jest.fn();
	const mockT = jest.fn();
	const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
	const mockUseTranslations = useTranslations as jest.MockedFunction<
		typeof useTranslations
	>;
	const mockUseLocaleContext = useLocaleContext as jest.MockedFunction<
		typeof useLocaleContext
	>;

	beforeEach(() => {
		mockUseRouter.mockReturnValue({
			refresh: mockRefresh,
		} as any);

		mockUseTranslations.mockReturnValue(mockT);
		mockT.mockImplementation((key: string) => {
			const translations: Record<string, string> = {
				title: "Language",
				english: "English",
				hebrew: "עברית",
			};
			return translations[key] || key;
		});

		mockUseLocaleContext.mockReturnValue({
			locale: "en",
			isRTL: false,
			direction: "ltr",
		});

		// Mock document.cookie
		Object.defineProperty(document, "cookie", {
			writable: true,
			value: "",
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders language title and options", () => {
		render(<LanguageSelector />);

		expect(screen.getByText("Language")).toBeInTheDocument();
		expect(screen.getByText("English")).toBeInTheDocument();
		expect(screen.getByText("עברית")).toBeInTheDocument();
	});

	it("highlights current locale", () => {
		mockUseLocaleContext.mockReturnValue({
			locale: "en",
			isRTL: false,
			direction: "ltr",
		});

		render(<LanguageSelector />);

		const englishButton = screen.getByRole("button", { name: /English/i });
		expect(englishButton).toHaveClass("bg-orange-50");

		// Check that the text has the orange color
		const englishText = screen.getByText("English");
		expect(englishText).toHaveClass("text-orange-600");
	});

	it("handles language change on click", () => {
		render(<LanguageSelector />);

		const hebrewButton = screen.getByRole("button", { name: /עברית/i });
		fireEvent.click(hebrewButton);

		expect(document.cookie).toBe("NEXT_LOCALE=he; path=/; max-age=31536000");
		expect(mockRefresh).toHaveBeenCalledTimes(1);
	});

	it("shows check icon for current locale", () => {
		mockUseLocaleContext.mockReturnValue({
			locale: "he",
			isRTL: true,
			direction: "rtl",
		});

		render(<LanguageSelector />);

		const hebrewButton = screen.getByRole("button", { name: /עברית/i });
		expect(hebrewButton.querySelector("svg")).toBeInTheDocument();
	});
});
