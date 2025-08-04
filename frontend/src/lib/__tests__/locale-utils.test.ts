import {
	createLocaleContext,
	getCSSDirection,
	getHTMLDirection,
	requiresRTL,
} from "../locale-utils";

describe("locale-utils", () => {
	describe("createLocaleContext", () => {
		it("should create LTR context for English", () => {
			const context = createLocaleContext("en");
			expect(context).toEqual({
				locale: "en",
				isRTL: false,
				direction: "ltr",
			});
		});

		it("should create RTL context for Hebrew", () => {
			const context = createLocaleContext("he");
			expect(context).toEqual({
				locale: "he",
				isRTL: true,
				direction: "rtl",
			});
		});
	});

	describe("getHTMLDirection", () => {
		it("should return ltr for English", () => {
			expect(getHTMLDirection("en")).toBe("ltr");
		});

		it("should return rtl for Hebrew", () => {
			expect(getHTMLDirection("he")).toBe("rtl");
		});
	});

	describe("getCSSDirection", () => {
		it("should return ltr for English", () => {
			expect(getCSSDirection("en")).toBe("ltr");
		});

		it("should return rtl for Hebrew", () => {
			expect(getCSSDirection("he")).toBe("rtl");
		});
	});

	describe("requiresRTL", () => {
		it("should return false for English", () => {
			expect(requiresRTL("en")).toBe(false);
		});

		it("should return true for Hebrew", () => {
			expect(requiresRTL("he")).toBe(true);
		});
	});
});
