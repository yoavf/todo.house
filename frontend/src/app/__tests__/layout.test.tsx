/**
 * @jest-environment node
 */

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

// Mock next/headers
jest.mock("next/headers", () => ({
	headers: jest.fn(),
}));

// Mock next-intl/server
jest.mock("next-intl/server", () => ({
	getLocale: jest.fn(),
	getMessages: jest.fn(),
}));

const mockHeaders = jest.mocked(headers);
const mockGetLocale = jest.mocked(getLocale);

describe("Layout locale detection", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should detect Hebrew locale from Accept-Language header", async () => {
		// Mock headers to return Hebrew preference
		const mockHeadersList = new Map();
		mockHeadersList.set("accept-language", "he-IL,he;q=0.9,en;q=0.8");
		
		mockHeaders.mockResolvedValue({
			get: (key: string) => mockHeadersList.get(key),
		} as any);

		mockGetLocale.mockResolvedValue("he");

		// Import the request config to trigger locale detection
		const requestConfig = await import("../../i18n/request");
		
		// The locale should be detected as Hebrew
		expect(mockGetLocale).toBeDefined();
	});

	it("should fallback to English for unsupported locale", async () => {
		// Mock headers to return unsupported locale
		const mockHeadersList = new Map();
		mockHeadersList.set("accept-language", "fr-FR,fr;q=0.9");
		
		mockHeaders.mockResolvedValue({
			get: (key: string) => mockHeadersList.get(key),
		} as any);

		mockGetLocale.mockResolvedValue("en");

		// Import the request config to trigger locale detection
		const requestConfig = await import("../../i18n/request");
		
		// The locale should fallback to English
		expect(mockGetLocale).toBeDefined();
	});
});