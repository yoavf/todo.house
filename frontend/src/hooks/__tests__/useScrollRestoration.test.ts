import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useScrollRestoration } from "../useScrollRestoration";

// Mock Next.js router
jest.mock("next/navigation", () => ({
	usePathname: jest.fn(() => "/"),
}));

// Mock sessionStorage
const mockSessionStorage = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
	value: mockSessionStorage,
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
	value: jest.fn((cb) => setTimeout(cb, 0)),
});

describe("useScrollRestoration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSessionStorage.getItem.mockClear();
		mockSessionStorage.setItem.mockClear();
		mockSessionStorage.removeItem.mockClear();
		
		// Reset window scroll position
		Object.defineProperty(window, "scrollX", { value: 0, writable: true });
		Object.defineProperty(window, "scrollY", { value: 0, writable: true });
		window.scrollTo = jest.fn();
	});

	it("should save scroll position when scrolling", async () => {
		const { result } = renderHook(() => useScrollRestoration());

		// Simulate scroll position
		Object.defineProperty(window, "scrollY", { value: 100, writable: true });

		// Manually trigger save
		act(() => {
			result.current.saveScrollPosition();
		});

		expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
			"scroll-position-/",
			JSON.stringify({ x: 0, y: 100 })
		);
	});

	it("should restore scroll position on mount", async () => {
		mockSessionStorage.getItem.mockReturnValue(
			JSON.stringify({ x: 0, y: 150 })
		);

		renderHook(() => useScrollRestoration());

		// Wait for requestAnimationFrame
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		expect(window.scrollTo).toHaveBeenCalledWith(0, 150);
	});

	it("should use custom storage key when provided", () => {
		const { result } = renderHook(() =>
			useScrollRestoration(undefined, { key: "custom-key" })
		);

		Object.defineProperty(window, "scrollY", { value: 200, writable: true });

		act(() => {
			result.current.saveScrollPosition();
		});

		expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
			"custom-key",
			JSON.stringify({ x: 0, y: 200 })
		);
	});

	it("should clear scroll position", () => {
		const { result } = renderHook(() => useScrollRestoration());

		act(() => {
			result.current.clearScrollPosition();
		});

		expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
			"scroll-position-/"
		);
	});

	it("should handle element ref for custom scrollable container", () => {
		const mockElement = {
			scrollTop: 100,
			scrollLeft: 50,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		} as any;

		const elementRef = { current: mockElement };
		const { result } = renderHook(() => useScrollRestoration(elementRef));

		act(() => {
			result.current.saveScrollPosition();
		});

		expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
			"scroll-position-/",
			JSON.stringify({ x: 50, y: 100 })
		);
	});

	it("should handle sessionStorage errors gracefully", () => {
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
		mockSessionStorage.setItem.mockImplementation(() => {
			throw new Error("Storage error");
		});

		const { result } = renderHook(() => useScrollRestoration());

		act(() => {
			result.current.saveScrollPosition();
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to save scroll position:",
			expect.any(Error)
		);

		consoleSpy.mockRestore();
	});

	it("should handle malformed data in sessionStorage", () => {
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
		mockSessionStorage.getItem.mockReturnValue("invalid-json");

		renderHook(() => useScrollRestoration());

		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to restore scroll position:",
			expect.any(Error)
		);

		consoleSpy.mockRestore();
	});

	it("should not restore when restoreOnMount is false", () => {
		mockSessionStorage.getItem.mockReturnValue(
			JSON.stringify({ x: 0, y: 150 })
		);

		renderHook(() =>
			useScrollRestoration(undefined, { restoreOnMount: false })
		);

		expect(window.scrollTo).not.toHaveBeenCalled();
	});

	it("should save position on component unmount", () => {
		Object.defineProperty(window, "scrollY", { value: 300, writable: true });

		const { unmount } = renderHook(() => useScrollRestoration());

		unmount();

		expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
			"scroll-position-/",
			JSON.stringify({ x: 0, y: 300 })
		);
	});
});