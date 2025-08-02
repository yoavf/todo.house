import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

describe("Header", () => {
	it("renders the app title", () => {
		render(<Header />);

		expect(screen.getByText("todo.house")).toBeInTheDocument();
	});

	it("renders the settings link", () => {
		render(<Header />);

		const settingsLink = screen.getByRole("link");
		expect(settingsLink).toBeInTheDocument();
		expect(settingsLink).toHaveAttribute("href", "/settings");
	});

	it("has correct styling", () => {
		render(<Header />);

		const title = screen.getByText("todo.house");
		expect(title).toHaveClass("text-3xl", "font-bold", "text-gray-800");

		const settingsLink = screen.getByRole("link");
		expect(settingsLink).toHaveClass("text-gray-600", "hover:text-gray-900");
	});

	it("renders settings icon", () => {
		render(<Header />);

		// The icon is rendered as an SVG within the link
		const settingsLink = screen.getByRole("link");
		const svg = settingsLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});
});
