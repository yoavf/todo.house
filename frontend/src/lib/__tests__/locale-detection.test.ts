import { 
	detectLocaleFromHeader, 
	detectLocaleWithMetadata,
	defaultLocale 
} from "../locale-detection";

describe("locale-detection", () => {
	describe("detectLocaleFromHeader", () => {
		it("should return default locale when no header is provided", () => {
			expect(detectLocaleFromHeader()).toBe(defaultLocale);
			expect(detectLocaleFromHeader("")).toBe(defaultLocale);
		});

		it("should detect supported locale from simple header", () => {
			expect(detectLocaleFromHeader("en")).toBe("en");
			expect(detectLocaleFromHeader("he")).toBe("he");
		});

		it("should detect locale with region code", () => {
			expect(detectLocaleFromHeader("en-US")).toBe("en");
			expect(detectLocaleFromHeader("he-IL")).toBe("he");
		});

		it("should handle complex Accept-Language header with quality values", () => {
			expect(detectLocaleFromHeader("en-US,en;q=0.9,he;q=0.8,fr;q=0.7")).toBe("en");
			expect(detectLocaleFromHeader("he-IL,he;q=0.9,en;q=0.8")).toBe("he");
			expect(detectLocaleFromHeader("fr;q=0.9,he;q=0.8,en;q=0.7")).toBe("he");
		});

		it("should prioritize by quality values", () => {
			expect(detectLocaleFromHeader("fr;q=0.9,he;q=0.8,en;q=0.7")).toBe("he");
			expect(detectLocaleFromHeader("fr;q=0.9,en;q=0.8,he;q=0.7")).toBe("en");
		});

		it("should fallback to default for unsupported locales", () => {
			expect(detectLocaleFromHeader("fr")).toBe(defaultLocale);
			expect(detectLocaleFromHeader("de-DE")).toBe(defaultLocale);
			expect(detectLocaleFromHeader("es,fr,de")).toBe(defaultLocale);
		});

		it("should handle malformed headers gracefully", () => {
			expect(detectLocaleFromHeader("invalid-header")).toBe(defaultLocale);
			expect(detectLocaleFromHeader(";;;")).toBe(defaultLocale);
			expect(detectLocaleFromHeader("en;q=invalid")).toBe("en");
		});

		it("should be case insensitive", () => {
			expect(detectLocaleFromHeader("EN")).toBe("en");
			expect(detectLocaleFromHeader("HE")).toBe("he");
			expect(detectLocaleFromHeader("En-US")).toBe("en");
		});
	});

	describe("detectLocaleWithMetadata", () => {
		it("should return metadata for default locale", () => {
			const result = detectLocaleWithMetadata();
			expect(result).toEqual({
				locale: defaultLocale,
				source: "default",
			});
		});

		it("should return metadata for header-detected locale", () => {
			const header = "he-IL,he;q=0.9,en;q=0.8";
			const result = detectLocaleWithMetadata(header);
			expect(result).toEqual({
				locale: "he",
				source: "header",
				originalHeader: header,
			});
		});

		it("should return metadata for fallback to default", () => {
			const header = "fr,de,es";
			const result = detectLocaleWithMetadata(header);
			expect(result).toEqual({
				locale: defaultLocale,
				source: "default",
				originalHeader: header,
			});
		});
	});
});