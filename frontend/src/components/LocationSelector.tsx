import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LocationSelectorProps {
	selectedLocation: string | null;
	onLocationChange: (location: string) => void;
}

export function LocationSelector({
	selectedLocation,
	onLocationChange,
}: LocationSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [filteredLocations, setFilteredLocations] = useState<typeof locations>(
		[],
	);
	const inputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations();

	const locations = useMemo(
		() => [
			{ id: "kitchen", name: t("locations.kitchen"), icon: "🍳" },
			{ id: "living-room", name: t("locations.livingRoom"), icon: "🛋️" },
			{ id: "bedroom", name: t("locations.bedroom"), icon: "🛏️" },
			{ id: "bathroom", name: t("locations.bathroom"), icon: "🚿" },
			{ id: "garage", name: t("locations.garage"), icon: "🚗" },
			{ id: "garden", name: t("locations.garden"), icon: "🌳" },
			{ id: "office", name: t("locations.office"), icon: "💼" },
			{ id: "attic", name: t("locations.attic"), icon: "🏠" },
			{ id: "basement", name: t("locations.basement"), icon: "🏚️" },
			{ id: "outdoor", name: t("locations.outdoor"), icon: "🌞" },
		],
		[t],
	);

	useEffect(() => {
		// Initialize input value with selected location
		if (selectedLocation && !isOpen) {
			setInputValue(selectedLocation);
		}
	}, [selectedLocation, isOpen]);

	useEffect(() => {
		// Filter locations based on input
		if (inputValue.trim()) {
			const filtered = locations.filter((loc) =>
				loc.name.toLowerCase().includes(inputValue.toLowerCase()),
			);
			setFilteredLocations(filtered);
		} else {
			setFilteredLocations(locations);
		}
	}, [inputValue, locations]);

	const handleInputClick = () => {
		setIsOpen(true);
		inputRef.current?.select();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setIsOpen(true);
	};

	const handleSelectLocation = (locationName: string) => {
		onLocationChange(locationName);
		setInputValue(locationName);
		setIsOpen(false);
	};

	const handleAddCustomLocation = () => {
		if (
			inputValue.trim() &&
			!locations.find((loc) => loc.name === inputValue.trim())
		) {
			onLocationChange(inputValue.trim());
			setIsOpen(false);
		}
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (filteredLocations.length > 0) {
				handleSelectLocation(filteredLocations[0].name);
			} else if (inputValue.trim()) {
				handleAddCustomLocation();
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			inputRef.current?.blur();
		}
	};

	const handleInputBlur = () => {
		// Delay closing to allow click events on dropdown items
		setTimeout(() => {
			setIsOpen(false);
		}, 200);
	};

	const selectedLocationData = locations.find(
		(loc) => loc.name === selectedLocation,
	);
	const showAddOption =
		inputValue.trim() &&
		!locations.find(
			(loc) => loc.name.toLowerCase() === inputValue.toLowerCase().trim(),
		);

	return (
		<div className="relative">
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					placeholder={t("locations.placeholder")}
					value={inputValue}
					onChange={handleInputChange}
					onClick={handleInputClick}
					onKeyDown={handleInputKeyDown}
					onBlur={handleInputBlur}
				/>
				{selectedLocationData && (
					<span className="absolute left-3 top-3.5 text-xl pointer-events-none">
						{selectedLocationData.icon}
					</span>
				)}
				<ChevronDownIcon
					size={20}
					className={`absolute right-3 top-3.5 text-gray-400 transition-transform pointer-events-none ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</div>

			{isOpen && (
				<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
					{showAddOption && (
						<button
							type="button"
							className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-3 border-b border-gray-100 text-orange-600"
							onMouseDown={(e) => e.preventDefault()}
							onClick={handleAddCustomLocation}
						>
							<PlusIcon size={20} />
							<span className="font-medium">
								{t("locations.addLocation", { location: inputValue })}
							</span>
						</button>
					)}
					{filteredLocations.map((location) => (
						<button
							key={location.id}
							type="button"
							className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => handleSelectLocation(location.name)}
						>
							<span className="text-xl">{location.icon}</span>
							<span className="font-medium">{location.name}</span>
						</button>
					))}
					{filteredLocations.length === 0 && !showAddOption && (
						<div className="px-4 py-3 text-gray-500 text-center">
							{t("locations.noLocationsFound")}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
