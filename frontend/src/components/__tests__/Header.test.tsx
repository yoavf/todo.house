import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

describe("Header", () => {
	it("renders the app title as a link to home", () => {
		render(<Header />);

		const titleLink = screen.getByRole("link", { name: "todo.house" });
		expect(titleLink).toBeInTheDocument();
		expect(titleLink).toHaveAttribute("href", "/");
		expect(titleLink).toHaveClass(
			"text-3xl",
			"font-bold",
			"text-gray-800",
			"hover:text-gray-900",
			"transition-colors",
		);
	});

	it("renders the settings link", () => {
		render(<Header />);

		const settingsLink = screen.getByRole("link", { name: "" });
		expect(settingsLink).toBeInTheDocument();
		expect(settingsLink).toHaveAttribute("href", "/settings");
		expect(settingsLink).toHaveClass("text-gray-600", "hover:text-gray-900");
	});

	it("renders settings icon", () => {
		render(<Header />);

		// The icon is rendered as an SVG within the settings link
		const settingsLink = screen.getByRole("link", { name: "" });
		const svg = settingsLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});
});
