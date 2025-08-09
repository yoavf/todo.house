/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

// Mock navigator.serviceWorker
const mockRegister = jest.fn(() =>
	Promise.resolve({
		scope: "http://localhost:3000/",
		addEventListener: jest.fn(),
	}),
);

Object.defineProperty(global.navigator, "serviceWorker", {
	value: {
		register: mockRegister,
	},
	writable: true,
});

describe("PWA Service Worker Registration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock console methods to avoid noise in tests
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should register service worker when supported", async () => {
		render(<ServiceWorkerRegistration />);

		// Wait for the effect to run
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockRegister).toHaveBeenCalledWith("/sw.js");
		expect(console.log).toHaveBeenCalledWith(
			"SW: Service Worker registered successfully",
			"http://localhost:3000/",
		);
	});

	it("should handle service worker registration failure", async () => {
		mockRegister.mockImplementationOnce(() =>
			Promise.reject(new Error("Registration failed")),
		);

		render(<ServiceWorkerRegistration />);

		// Wait for the effect to run
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockRegister).toHaveBeenCalledWith("/sw.js");
		expect(console.log).toHaveBeenCalledWith(
			"SW: Service Worker registration failed",
			expect.any(Error),
		);
	});

	it("should render nothing (null)", () => {
		const { container } = render(<ServiceWorkerRegistration />);
		expect(container.firstChild).toBeNull();
	});
});
