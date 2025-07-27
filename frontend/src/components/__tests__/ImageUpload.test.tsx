import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUpload } from "../ImageUpload";

describe("ImageUpload", () => {
	const mockOnImageSelect = jest.fn();

	beforeEach(() => {
		mockOnImageSelect.mockClear();
	});

	it("renders upload area with correct text", () => {
		render(<ImageUpload onImageSelect={mockOnImageSelect} />);

		expect(
			screen.getByText("Drop an image or click to upload"),
		).toBeInTheDocument();
		expect(
			screen.getByText("JPEG, PNG, or WebP up to 10MB"),
		).toBeInTheDocument();
	});

	it("accepts valid image files", async () => {
		const user = userEvent.setup();
		render(<ImageUpload onImageSelect={mockOnImageSelect} />);

		const file = new File(["test"], "test.png", { type: "image/png" });
		const input = screen.getByLabelText("Upload image");

		await user.upload(input, file);

		expect(mockOnImageSelect).toHaveBeenCalledWith(file);
		expect(mockOnImageSelect).toHaveBeenCalledTimes(1);
	});

	it("displays validation error for invalid file types", () => {
		render(<ImageUpload onImageSelect={mockOnImageSelect} />);

		// Test validation directly by calling handleFile
		const dropZone = screen
			.getByText("Drop an image or click to upload")
			.closest("div");
		if (!dropZone) throw new Error("Drop zone not found");
		const file = new File(["test"], "test.txt", { type: "text/plain" });

		// Simulate drop with invalid file
		fireEvent.drop(dropZone, {
			dataTransfer: { files: [file] },
		});

		waitFor(() => {
			expect(mockOnImageSelect).not.toHaveBeenCalled();
			expect(
				screen.getByText("Please upload a JPEG, PNG, or WebP image"),
			).toBeInTheDocument();
		});
	});

	it("rejects files that are too large", async () => {
		const user = userEvent.setup();
		render(<ImageUpload onImageSelect={mockOnImageSelect} maxSizeMB={1} />);

		// Create a 2MB file (larger than 1MB limit)
		const largeArray = new Array(2 * 1024 * 1024).fill("a");
		const largeFile = new File([largeArray.join("")], "large.png", {
			type: "image/png",
		});
		const input = screen.getByLabelText("Upload image");

		await user.upload(input, largeFile);

		await waitFor(() => {
			expect(mockOnImageSelect).not.toHaveBeenCalled();
			expect(
				screen.getByText("Image must be less than 1MB"),
			).toBeInTheDocument();
		});
	});

	it("handles drag and drop", async () => {
		render(<ImageUpload onImageSelect={mockOnImageSelect} />);

		const dropZone = screen
			.getByText("Drop an image or click to upload")
			.closest("div");
		if (!dropZone) throw new Error("Drop zone not found");
		const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

		// Simulate drag over
		fireEvent.dragOver(dropZone, {
			dataTransfer: { files: [file] },
		});

		expect(screen.getByText("Drop your image here")).toBeInTheDocument();

		// Simulate drop
		fireEvent.drop(dropZone, {
			dataTransfer: { files: [file] },
		});

		await waitFor(() => {
			expect(mockOnImageSelect).toHaveBeenCalledWith(file);
		});
	});

	it("handles drag leave", () => {
		render(<ImageUpload onImageSelect={mockOnImageSelect} />);

		const dropZone = screen
			.getByText("Drop an image or click to upload")
			.closest("div");
		if (!dropZone) throw new Error("Drop zone not found");

		// Simulate drag over
		fireEvent.dragOver(dropZone);
		expect(screen.getByText("Drop your image here")).toBeInTheDocument();

		// Simulate drag leave
		fireEvent.dragLeave(dropZone);
		expect(
			screen.getByText("Drop an image or click to upload"),
		).toBeInTheDocument();
	});

	it("disables input when processing", () => {
		render(
			<ImageUpload onImageSelect={mockOnImageSelect} isProcessing={true} />,
		);

		const input = screen.getByLabelText("Upload image");
		expect(input).toBeDisabled();
	});

	it("accepts all valid image formats", async () => {
		const user = userEvent.setup();
		const formats = [
			{ name: "test.jpg", type: "image/jpeg" },
			{ name: "test.jpeg", type: "image/jpeg" },
			{ name: "test.png", type: "image/png" },
			{ name: "test.webp", type: "image/webp" },
		];

		for (const format of formats) {
			mockOnImageSelect.mockClear();
			const { unmount } = render(
				<ImageUpload onImageSelect={mockOnImageSelect} />,
			);

			const file = new File(["test"], format.name, { type: format.type });
			const input = screen.getByLabelText("Upload image");

			await user.upload(input, file);

			expect(mockOnImageSelect).toHaveBeenCalledWith(file);
			unmount();
		}
	});
});
