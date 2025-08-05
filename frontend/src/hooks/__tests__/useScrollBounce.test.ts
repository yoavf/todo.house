import { act, renderHook } from "@testing-library/react";
import { useScrollBounce } from "../useScrollBounce";

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe("useScrollBounce", () => {
	let mockAddEventListener: jest.Mock;
	let mockRemoveEventListener: jest.Mock;

	beforeEach(() => {
		mockAddEventListener = jest.fn();
		mockRemoveEventListener = jest.fn();

		// Mock window object
		Object.defineProperty(window, "scrollY", {
			value: 0,
			writable: true,
		});
		Object.defineProperty(window, "innerHeight", {
			value: 800,
			writable: true,
		});
		Object.defineProperty(window, "addEventListener", {
			value: mockAddEventListener,
			writable: true,
		});
		Object.defineProperty(window, "removeEventListener", {
			value: mockRemoveEventListener,
			writable: true,
		});

		// Mock document
		Object.defineProperty(document, "documentElement", {
			value: {
				scrollHeight: 1600,
			},
			writable: true,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	it("should initialize with default state", () => {
		const { result } = renderHook(() => useScrollBounce());

		expect(result.current.isBouncingTop).toBe(false);
		expect(result.current.isBouncingBottom).toBe(false);
		expect(result.current.transform).toBe("");
	});

	it("should add scroll event listener on mount", () => {
		renderHook(() => useScrollBounce());

		expect(mockAddEventListener).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
			{ passive: true },
		);
	});

	it("should remove scroll event listener on unmount", () => {
		const { unmount } = renderHook(() => useScrollBounce());

		unmount();

		expect(mockRemoveEventListener).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
		);
	});

	it("should handle scroll bounce when at bottom edge", () => {
		const { result } = renderHook(() => useScrollBounce());

		// Simulate scroll event handler
		const scrollHandler = mockAddEventListener.mock.calls[0][1];

		// Set scroll position at bottom (scrollY + innerHeight >= scrollHeight - threshold)
		(window as any).scrollY = 800; // innerHeight=800, scrollHeight=1600, so at bottom

		act(() => {
			scrollHandler();
		});

		// Should trigger bottom bounce when at bottom edge
		expect(result.current.isBouncingBottom).toBe(true);
		expect(result.current.transform).toBe("translateY(-15px)");
	});

	it("should handle scroll bounce when at top edge", () => {
		const { result } = renderHook(() => useScrollBounce());

		// Simulate scroll event handler
		const scrollHandler = mockAddEventListener.mock.calls[0][1];

		// Start with scroll position slightly above 0
		(window as any).scrollY = 10;

		act(() => {
			scrollHandler(); // Initial scroll to establish lastScrollTop
		});

		// Clear any debounce state
		jest.runAllTimers();

		// Now scroll to top (negative delta)
		(window as any).scrollY = 0;

		act(() => {
			scrollHandler();
		});

		// Should trigger top bounce when scrolling up to top edge
		expect(result.current.isBouncingTop).toBe(true);
		expect(result.current.transform).toBe("translateY(15px)");
	});

	it("should accept custom configuration", () => {
		const customOptions = {
			threshold: 20,
			duration: 500,
		};

		const { result } = renderHook(() => useScrollBounce(customOptions));

		expect(result.current.isBouncingTop).toBe(false);
		expect(result.current.isBouncingBottom).toBe(false);
		expect(result.current.transform).toBe("");
	});

	it("should work with custom target element", () => {
		const mockElement = {
			scrollTop: 0,
			scrollHeight: 1200,
			clientHeight: 600,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		};

		renderHook(() =>
			useScrollBounce({ target: mockElement as unknown as HTMLElement }),
		);

		expect(mockElement.addEventListener).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
			{ passive: true },
		);
	});
});
