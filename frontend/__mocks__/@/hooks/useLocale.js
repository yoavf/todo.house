// Mock for useLocale hook
const useLocale = jest.fn(() => ({
	locale: "en",
	isRTL: false,
	direction: "ltr",
}));

const useRTLClasses = jest.fn(() => ({
	mirrorIcon: jest.fn(() => ""),
	conditionalMirror: "rtl:mirror",
	flexRowReverseRTL: "flex-row-reverse-rtl",
	combine: jest.fn((baseClasses, rtlClasses) => baseClasses),
	getArrowIcon: jest.fn(() => "ArrowRightIcon"),
	getSwipeDirection: jest.fn(() => ({
		positive: "right",
		negative: "left",
	})),
}));

module.exports = {
	useLocale,
	useRTLClasses,
};
