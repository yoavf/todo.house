import {
	AlertCircle,
	Camera,
	Check,
	CheckCircle,
	CheckSquare,
	Clipboard,
	Edit2,
	Image,
	ImageOff,
	Info,
	Lightbulb,
	Loader2,
	Plus,
	RefreshCcw,
	Trash2,
	Upload,
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

export type IconName = keyof typeof Icons;
