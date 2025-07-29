export interface Task {
	id: string;
	title: string;
	description?: string;
	category:
		| "maintenance"
		| "exterior"
		| "interior"
		| "plumbing"
		| "safety"
		| "seasonal";
	effort: "low" | "medium" | "high";
	type: "suggested" | "custom" | "recurring";
	lastCompleted?: Date;
	dueDate?: Date;
	frequency?: string;
	completed: boolean;
}

export interface Appliance {
	id: string;
	name: string;
	model: string;
	category: string;
	location: string;
	purchaseDate: Date;
	warrantyUntil: Date;
	lastService?: Date;
	notes?: string;
}

export const mockTasks: Task[] = [
	{
		id: "1",
		title: "Change HVAC Filter",
		description: "It's been 3 months since your last filter change",
		category: "maintenance",
		effort: "low",
		type: "suggested",
		lastCompleted: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
		completed: false,
	},
	{
		id: "2",
		title: "Clean Gutters",
		description: "Fall leaves may be causing blockage",
		category: "exterior",
		effort: "medium",
		type: "suggested",
		lastCompleted: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
		completed: false,
	},
	{
		id: "3",
		title: "Test Smoke Detectors",
		description: "Regular testing ensures proper function",
		category: "safety",
		effort: "low",
		type: "custom",
		completed: false,
	},
	{
		id: "4",
		title: "Check Water Heater",
		description: "Annual inspection recommended",
		category: "plumbing",
		effort: "low",
		type: "recurring",
		lastCompleted: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
		completed: false,
	},
	{
		id: "5",
		title: "Deep Clean Kitchen",
		description: "Including appliances and cabinets",
		category: "interior",
		effort: "high",
		type: "custom",
		lastCompleted: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
		completed: true,
	},
];

export const mockAppliances: Appliance[] = [
	{
		id: "1",
		name: "LG Refrigerator",
		model: "LFXS26973S",
		category: "Kitchen",
		location: "Kitchen",
		purchaseDate: new Date("2020-05-15"),
		warrantyUntil: new Date("2025-05-15"),
		lastService: new Date("2023-01-10"),
	},
	{
		id: "2",
		name: "Samsung Washing Machine",
		model: "WF45R6100AP",
		category: "Laundry",
		location: "Laundry Room",
		purchaseDate: new Date("2021-06-23"),
		warrantyUntil: new Date("2024-06-23"),
	},
	{
		id: "3",
		name: "Sony TV",
		model: "XBR-65X900H",
		category: "Entertainment",
		location: "Living Room",
		purchaseDate: new Date("2020-12-10"),
		warrantyUntil: new Date("2023-12-10"),
	},
	{
		id: "4",
		name: "Carrier HVAC System",
		model: "Infinity 26",
		category: "Climate",
		location: "Utility Room",
		purchaseDate: new Date("2019-08-05"),
		warrantyUntil: new Date("2029-08-05"),
		lastService: new Date("2023-04-12"),
	},
];

export const upcomingMaintenance = [
	{
		id: "1",
		title: "HVAC Service",
		date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		icon: "🌡️",
	},
	{
		id: "2",
		title: "Window Cleaning",
		date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
		icon: "🪟",
	},
];

export interface TaskDetail {
	id: string;
	howTos: {
		title: string;
		steps: string[];
		difficulty: "easy" | "medium" | "hard";
		estimatedTime: string;
	}[];
	shoppingList: {
		item: string;
		category: string;
		estimatedCost: string;
		priority: "essential" | "recommended" | "optional";
	}[];
	tips: string[];
	safetyNotes: string[];
}

export const taskDetails: Record<string, TaskDetail> = {
	"replace-air-filters": {
		id: "replace-air-filters",
		howTos: [
			{
				title: "Replace Standard HVAC Filter",
				difficulty: "easy",
				estimatedTime: "15 minutes",
				steps: [
					"Turn off your HVAC system at the thermostat",
					"Locate the air filter (usually near the air handler or in return air ducts)",
					"Note the size printed on the old filter frame",
					"Remove the old filter and note airflow direction arrows",
					"Insert new filter with arrows pointing toward the air handler",
					"Turn your HVAC system back on",
				],
			},
		],
		shoppingList: [
			{
				item: "HVAC Air Filter (check size: 16x20x1, 20x25x1, etc.)",
				category: "HVAC",
				estimatedCost: "$8-15",
				priority: "essential",
			},
			{
				item: "Disposable gloves",
				category: "Safety",
				estimatedCost: "$3-5",
				priority: "recommended",
			},
		],
		tips: [
			"Replace filters every 1-3 months depending on usage and pets",
			"Higher MERV ratings filter more particles but may restrict airflow",
			"Mark your calendar to remember regular replacements",
		],
		safetyNotes: [
			"Always turn off HVAC system before replacing filters",
			"Wear gloves to avoid cuts from metal filter frames",
		],
	},
	"check-smoke-detectors": {
		id: "check-smoke-detectors",
		howTos: [
			{
				title: "Test Smoke Detector Function",
				difficulty: "easy",
				estimatedTime: "10 minutes per detector",
				steps: [
					"Press and hold the test button on each smoke detector",
					"Listen for a loud beep - if weak or no sound, replace battery",
					"Clean detector with vacuum brush attachment to remove dust",
					"Check expiration date on back of detector",
					"Test monthly and replace batteries twice yearly",
				],
			},
		],
		shoppingList: [
			{
				item: "9V batteries or AA batteries (check your detector type)",
				category: "Electronics",
				estimatedCost: "$5-10",
				priority: "essential",
			},
			{
				item: "New smoke detector (if over 10 years old)",
				category: "Safety",
				estimatedCost: "$15-30",
				priority: "recommended",
			},
		],
		tips: [
			"Test detectors monthly on the same date",
			"Replace batteries when you change clocks for daylight saving",
			"Interconnected detectors should all beep when one is tested",
		],
		safetyNotes: [
			"Never remove batteries to stop nuisance alarms",
			"Replace entire detector every 10 years",
		],
	},
	"clean-gutters": {
		id: "clean-gutters",
		howTos: [
			{
				title: "Clean Gutters and Downspouts",
				difficulty: "medium",
				estimatedTime: "2-4 hours",
				steps: [
					"Set up ladder safely on level ground with spotter",
					"Remove large debris by hand (wear gloves)",
					"Scoop out remaining debris with gutter scoop",
					"Flush gutters with hose toward downspouts",
					"Check for leaks and proper water flow",
					"Clean downspout outlets and extensions",
				],
			},
		],
		shoppingList: [
			{
				item: "Work gloves",
				category: "Safety",
				estimatedCost: "$8-12",
				priority: "essential",
			},
			{
				item: "Gutter scoop or garden trowel",
				category: "Tools",
				estimatedCost: "$10-15",
				priority: "essential",
			},
			{
				item: "Garden hose with spray nozzle",
				category: "Tools",
				estimatedCost: "$20-30",
				priority: "essential",
			},
			{
				item: "Ladder stabilizer",
				category: "Safety",
				estimatedCost: "$30-50",
				priority: "recommended",
			},
		],
		tips: [
			"Clean gutters twice yearly - spring and fall",
			"Consider gutter guards to reduce future cleaning",
			"Check for proper gutter slope toward downspouts",
		],
		safetyNotes: [
			"Never work alone on a ladder",
			"Don't lean ladder against gutters - use roof hooks",
			"Avoid working in windy or wet conditions",
		],
	},
};
