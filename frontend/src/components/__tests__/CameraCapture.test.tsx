import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CameraCapture } from "../CameraCapture";

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, "mediaDevices", {
	value: {
		getUserMedia: mockGetUserMedia,
	},
	writable: true,
});

// Mock HTMLVideoElement methods
Object.defineProperty(HTMLVideoElement.prototype, "play", {
	value: jest.fn(),
	writable: true,
});

// Mock HTMLCanvasElement methods
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
	value: jest.fn(() => ({
		drawImage: jest.fn(),
	})),
	writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
	value: jest.fn((callback) => {
		const mockBlob = new Blob(["test"], { type: "image/jpeg" });
		callback(mockBlob);
	}),
	writable: true,
});

describe("CameraCapture", () => {
	const mockOnCapture = jest.fn();
	const mockOnError = jest.fn();
	const mockOnClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should not render when isOpen is false", () => {
		render(
			<CameraCapture
				isOpen={false}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		expect(screen.queryByText("Capture Photo")).not.toBeInTheDocument();
	});

	it("should render when isOpen is true", () => {
		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		expect(screen.getByText("Capture Photo")).toBeInTheDocument();
	});

	it("should call onClose when close button is clicked", () => {
		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		const closeButton = screen.getByLabelText("Close camera");
		fireEvent.click(closeButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it("should handle camera access denied", async () => {
		const mockError = new Error("Permission denied");
		mockError.name = "NotAllowedError";
		mockGetUserMedia.mockRejectedValueOnce(mockError);

		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		await waitFor(() => {
			expect(mockOnError).toHaveBeenCalledWith(
				"Camera access denied. Please allow camera access and try again, or use file upload instead.",
			);
		});
	});

	it("should handle no camera found", async () => {
		const mockError = new Error("No camera found");
		mockError.name = "NotFoundError";
		mockGetUserMedia.mockRejectedValueOnce(mockError);

		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		await waitFor(() => {
			expect(mockOnError).toHaveBeenCalledWith(
				"No camera found on this device. Please use file upload instead.",
			);
		});
	});

	it("should handle camera not supported", async () => {
		const mockError = new Error("Camera not supported");
		mockError.name = "NotSupportedError";
		mockGetUserMedia.mockRejectedValueOnce(mockError);

		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		await waitFor(() => {
			expect(mockOnError).toHaveBeenCalledWith(
				"Camera is not supported on this device. Please use file upload instead.",
			);
		});
	});

	it("should start camera successfully", async () => {
		const mockStream = {
			getTracks: jest.fn(() => [{ stop: jest.fn() }]),
		};
		mockGetUserMedia.mockResolvedValueOnce(mockStream);

		render(
			<CameraCapture
				isOpen={true}
				onCapture={mockOnCapture}
				onError={mockOnError}
				onClose={mockOnClose}
			/>,
		);

		await waitFor(() => {
			expect(mockGetUserMedia).toHaveBeenCalledWith({
				video: {
					facingMode: "environment",
					width: { ideal: 1920, max: 1920 },
					height: { ideal: 1080, max: 1080 },
				},
				audio: false,
			});
		});
	});
});
