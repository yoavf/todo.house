import {
	AirVent,
	AlertCircle,
	Camera,
	Check,
	CheckCircle,
	CheckSquare,
	Clipboard,
	Edit2,
	GlassWater,
	Image,
	ImageOff,
	Info,
	Lightbulb,
	Loader2,
	Microwave,
	Plus,
	RefreshCcw,
	// Appliance icons
	Refrigerator,
	SatelliteDish,
	Trash2,
	Upload,
	WashingMachine,
	Wind,
	X,
} from "lucide-react";

export const Icons = {
	// Task management
	add: Plus,
	check: Check,
	close: X,
	edit: Edit2,
	delete: Trash2,
	clipboard: Clipboard,
	checkSquare: CheckSquare,

	// Status & feedback
	error: AlertCircle,
	success: CheckCircle,
	info: Info,

	// Image & camera
	camera: Camera,
	upload: Upload,
	image: Image,
	imageOff: ImageOff,

	// AI & generation
	lightbulb: Lightbulb,

	// Actions
	switchCamera: RefreshCcw,

	// Loading
	loader: Loader2,
};

// Appliance icons - exported separately for direct use in components
export const RefrigeratorIcon = Refrigerator;
export const WashingMachineIcon = WashingMachine;
export const MicrowaveIcon = Microwave;
export const OvenIcon = Microwave; // Using microwave as oven placeholder
export const DishwasherIcon = SatelliteDish; // Using satellite dish as dishwasher placeholder
export const DryerIcon = Wind; // Using wind for dryer
export const AirConditionerIcon = AirVent;
export const WaterHeaterIcon = GlassWater;

export type IconName = keyof typeof Icons;
