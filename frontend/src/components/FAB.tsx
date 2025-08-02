import { CameraIcon, KeyboardIcon, MicIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

interface FABProps {
	onKeyboardClick?: () => void;
	onMicrophoneClick?: () => void;
	onCameraClick?: () => void;
}

export function FAB({
	onKeyboardClick,
	onMicrophoneClick,
	onCameraClick,
}: FABProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const handleCameraClick = () => {
		onCameraClick?.();
		setIsOpen(false);
	};

	return (
		<div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
			{isOpen && (
				<div className="flex flex-col gap-3 mb-3 items-end">
					<button
						type="button"
						data-testid="fab-keyboard"
						className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-700 shadow-lg hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105"
						onClick={() => {
							onKeyboardClick?.();
							setIsOpen(false);
						}}
					>
						<KeyboardIcon size={20} />
					</button>
					<button
						type="button"
						data-testid="fab-microphone"
						className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-700 shadow-lg hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105"
						onClick={() => {
							onMicrophoneClick?.();
							setIsOpen(false);
						}}
					>
						<MicIcon size={20} />
					</button>
					<button
						type="button"
						data-testid="fab-camera"
						className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-700 shadow-lg hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105"
						onClick={handleCameraClick}
					>
						<CameraIcon size={20} />
					</button>
				</div>
			)}
			<button
				type="button"
				className={`flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-all transform ${isOpen ? "rotate-45" : ""}`}
				onClick={toggleOpen}
			>
				<PlusIcon size={24} />
			</button>
		</div>
	);
}
