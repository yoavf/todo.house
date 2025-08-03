import { LoaderIcon } from "lucide-react";
import { useEffect } from "react";

interface ImageProcessingProps {
	imageUrl: string;
	onComplete: () => void;
}

export function ImageProcessing({
	imageUrl,
	onComplete,
}: ImageProcessingProps) {
	useEffect(() => {
		// Simulate processing time
		const timer = setTimeout(() => {
			onComplete();
		}, 2500);

		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-6">
			<div className="max-w-md w-full flex flex-col items-center text-center">
				{/* Preview of the image being processed */}
				<div className="w-32 h-32 mb-6 rounded-lg overflow-hidden bg-gray-100">
					<img
						src={imageUrl}
						alt="Processing"
						className="w-full h-full object-cover opacity-50"
					/>
				</div>

				{/* Animated loader */}
				<div className="w-16 h-16 mb-6 text-orange-500">
					<LoaderIcon size={64} className="animate-spin" />
				</div>

				<h2 className="text-xl font-semibold text-gray-800 mb-2">
					Analyzing your image
				</h2>
				<p className="text-gray-600">
					Looking for tasks and generating suggestions...
				</p>

				{/* Progress indicator */}
				<div className="w-full max-w-xs mt-8">
					<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
						<div className="h-full bg-orange-500 rounded-full animate-progress"></div>
					</div>
				</div>
			</div>

			<style jsx>{`
				@keyframes progress {
					0% {
						width: 0%;
					}
					100% {
						width: 100%;
					}
				}
				.animate-progress {
					animation: progress 2.5s ease-out forwards;
				}
			`}</style>
		</div>
	);
}
