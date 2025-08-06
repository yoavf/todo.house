import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { RoomManager } from "../RoomManager";

// Mock next-intl
jest.mock("next-intl", () => ({
	useTranslations: jest.fn(),
}));

describe("RoomManager", () => {
	const mockT = jest.fn();
	const mockTDefault = jest.fn();
	const mockTCommon = jest.fn();
	const mockUseTranslations = useTranslations as jest.MockedFunction<
		typeof useTranslations
	>;

	beforeEach(() => {
		mockUseTranslations.mockImplementation((key: string) => {
			if (key === "settings.rooms") return mockT;
			if (key === "settings.rooms.defaultRooms") return mockTDefault;
			if (key === "common") return mockTCommon;
			return jest.fn();
		});

		mockT.mockImplementation((key: string) => {
			const translations: Record<string, string> = {
				title: "Rooms",
				addRoom: "Add Room",
				editRoom: "Edit Room",
				deleteRoom: "Delete Room",
				roomName: "Room name",
			};
			return translations[key] || key;
		});

		mockTDefault.mockImplementation((key: string) => {
			const translations: Record<string, string> = {
				livingRoom: "Living Room",
				kitchen: "Kitchen",
				bathroom: "Bathroom",
				bedroom: "Bedroom",
				office: "Office",
				garage: "Garage",
				backyard: "Backyard",
			};
			return translations[key] || key;
		});

		mockTCommon.mockImplementation((key: string) => {
			const translations: Record<string, string> = {
				cancel: "Cancel",
				save: "Save",
			};
			return translations[key] || key;
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders title and default rooms", () => {
		render(<RoomManager />);

		expect(screen.getByText("Rooms")).toBeInTheDocument();
		expect(screen.getByText("Living Room")).toBeInTheDocument();
		expect(screen.getByText("Kitchen")).toBeInTheDocument();
		expect(screen.getByText("Bathroom")).toBeInTheDocument();
		expect(screen.getByText("Bedroom")).toBeInTheDocument();
		expect(screen.getByText("Office")).toBeInTheDocument();
		expect(screen.getByText("Garage")).toBeInTheDocument();
		expect(screen.getByText("Backyard")).toBeInTheDocument();
	});

	it("shows Add Room button", () => {
		render(<RoomManager />);

		expect(
			screen.getByRole("button", { name: /Add Room/i }),
		).toBeInTheDocument();
	});

	it("renders edit and delete buttons for each room", () => {
		render(<RoomManager />);

		const editButtons = screen
			.getAllByRole("button", { name: "" })
			.filter((button) => button.querySelector('svg[class*="lucide-pencil"]'));
		const deleteButtons = screen
			.getAllByRole("button", { name: "" })
			.filter((button) => button.querySelector('svg[class*="lucide-trash"]'));

		// Should have edit and delete buttons for each of the 7 default rooms
		expect(editButtons).toHaveLength(7);
		expect(deleteButtons).toHaveLength(7);
	});

	it("opens add room dialog when Add Room is clicked", async () => {
		const user = userEvent.setup();
		render(<RoomManager />);

		const addButton = screen.getByRole("button", { name: /Add Room/i });
		await user.click(addButton);

		await waitFor(() => {
			expect(screen.getByLabelText("Room name")).toBeInTheDocument();
		});
	});

	it("adds a new room when form is submitted", async () => {
		const user = userEvent.setup();
		render(<RoomManager />);

		// Open add room dialog
		const addButton = screen.getByRole("button", { name: /Add Room/i });
		await user.click(addButton);

		// Wait for dialog to be open and enter room name
		await waitFor(async () => {
			const input = screen.getByLabelText("Room name");
			await user.type(input, "Basement");
		});

		// Submit form
		const saveButton = screen.getByRole("button", { name: /Save/i });
		await user.click(saveButton);

		// Check that room was added and dialog closed
		await waitFor(() => {
			expect(screen.getByText("Basement")).toBeInTheDocument();
			expect(screen.queryByLabelText("Room name")).not.toBeInTheDocument();
		});
	});

	it("cancels add room dialog", async () => {
		const user = userEvent.setup();
		render(<RoomManager />);

		// Open dialog
		const addButton = screen.getByRole("button", { name: /Add Room/i });
		await user.click(addButton);

		// Wait for dialog and cancel
		await waitFor(async () => {
			const cancelButton = screen.getByRole("button", { name: /Cancel/i });
			await user.click(cancelButton);
		});

		// Check dialog is closed
		await waitFor(() => {
			expect(screen.queryByLabelText("Room name")).not.toBeInTheDocument();
		});
	});

	it("prevents adding empty room names", async () => {
		const user = userEvent.setup();
		render(<RoomManager />);

		// Open dialog
		const addButton = screen.getByRole("button", { name: /Add Room/i });
		await user.click(addButton);

		// Try to save without entering a name
		await waitFor(async () => {
			const saveButton = screen.getByRole("button", { name: /Save/i });
			await user.click(saveButton);
		});

		// Dialog should still be open
		await waitFor(() => {
			expect(screen.getByLabelText("Room name")).toBeInTheDocument();
		});
	});

	it("adds and deletes a custom room", async () => {
		const user = userEvent.setup();
		render(<RoomManager />);

		// Add a custom room
		const addButton = screen.getByRole("button", { name: /Add Room/i });
		await user.click(addButton);

		await waitFor(async () => {
			const input = screen.getByLabelText("Room name");
			await user.type(input, "Test Room");
		});

		const saveButton = screen.getByRole("button", { name: /Save/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText("Test Room")).toBeInTheDocument();
		});

		// Now delete the test room
		const testRoomRow = screen.getByText("Test Room").closest("div");
		const deleteButton = testRoomRow
			?.querySelector("svg[class*='hover:text-red-600']")
			?.closest("button");

		if (deleteButton) {
			await user.click(deleteButton);

			await waitFor(() => {
				expect(screen.queryByText("Test Room")).not.toBeInTheDocument();
			});
		}
	});
});
