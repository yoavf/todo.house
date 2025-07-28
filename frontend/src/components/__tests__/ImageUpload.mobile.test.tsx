import { render, screen } from "@testing-library/react";
import { ImageUpload } from "../ImageUpload";

// Mock the API
jest.mock("@/lib/api", () => ({
	tasksAPI: {
		analyzeImage: jest.fn(),
	},
}));

// Mock navigator.userAgent for mobile detection
Object.defineProperty(navigator, "userAgent", {
	value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
	writable: true,
});

// Mock window properties for mobile detection
Object.defineProperty(window, "innerWidth", {
	value: 375,
	writable: true,
});

Object.defineProperty(window, "ontouchstart", {
	value: true,
	writable: true,
});

Object.defineProperty(navigator, "maxTouchPoints", {
	value: 5,
	writable: true,
});

describe("ImageUpload Mobile Functionality", () => {
	const mockOnTasksGenerated = jest.fn();
	const mockOnError = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should show camera button on mobile devices", () => {
		render(
			<ImageUpload
				onTasksGenerated={mockOnTasksGenerated}
				onError={mockOnError}
			/>,
		);

		// Should show mobile-specific text
		expect(screen.getByText("Tap to select an image")).toBeInTheDocument();

		// Should show camera button
		expect(screen.getByText("Take Photo")).toBeInTheDocument();

		// Should show "or" separator
		expect(screen.getByText("or")).toBeInTheDocument();
	});

	it("should have Take Photo button clickable", () => {
		render(
			<ImageUpload
				onTasksGenerated={mockOnTasksGenerated}
				onError={mockOnError}
			/>,
		);

		const takePhotoButton = screen.getByRole("button", { name: /take photo/i });

		// Button should be clickable
		expect(takePhotoButton).toBeEnabled();
		expect(takePhotoButton.tagName).toBe("BUTTON");
	});

	it("should have responsive styling for mobile", () => {
		render(
			<ImageUpload
				onTasksGenerated={mockOnTasksGenerated}
				onError={mockOnError}
			/>,
		);

		// Should have camera button with green styling
		const takePhotoButton = screen.getByText("Take Photo");
		expect(takePhotoButton).toBeInTheDocument();

		// Check that the button has the expected structure and green styling
		const buttonElement = takePhotoButton.closest("button");
		expect(buttonElement).toHaveClass("from-green-500");
	});
});
