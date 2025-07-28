"use client";

import { useCallback, useState } from "react";
import { useCamera } from "@/hooks/useCamera";

interface CameraCaptureProps {
	onCapture: (file: File) => void;
	onClose: () => void;
	onError?: (error: string) => void;
}

export function CameraCapture({
	onCapture,
	onClose,
	onError,
}: CameraCaptureProps) {
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

	const {
		videoRef,
		canvasRef,
		isLoading,
		error,
		hasPermission,
		startCamera,
		stopCamera,
		capturePhoto,
		switchCamera,
	} = useCamera({
		onError,
		facingMode: "environment", // Default to back camera
	});

	const handleCapture = useCallback(async () => {
		const blob = await capturePhoto();
		if (blob) {
			setCapturedBlob(blob);
			// Create preview URL
			const url = URL.createObjectURL(blob);
			setCapturedImage(url);
			// Stop camera after capture
			stopCamera();
		}
	}, [capturePhoto, stopCamera]);

	const handleRetake = useCallback(() => {
		if (capturedImage) {
			URL.revokeObjectURL(capturedImage);
		}
		setCapturedImage(null);
		setCapturedBlob(null);
		startCamera();
	}, [capturedImage, startCamera]);

	const handleConfirm = useCallback(() => {
		if (capturedBlob) {
			// Convert blob to file
			const file = new File([capturedBlob], `photo-${Date.now()}.jpg`, {
				type: "image/jpeg",
			});
			onCapture(file);
		}
	}, [capturedBlob, onCapture]);

	const handleClose = useCallback(() => {
		stopCamera();
		if (capturedImage) {
			URL.revokeObjectURL(capturedImage);
		}
		onClose();
	}, [stopCamera, capturedImage, onClose]);

	// Start camera on mount if not already started
	useState(() => {
		startCamera();
	});

	return (
		<div className="fixed inset-0 z-50 bg-black flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 bg-black/50">
				<h2 className="text-white text-lg font-semibold">Take Photo</h2>
				<button
					type="button"
					onClick={handleClose}
					className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
					aria-label="Close camera"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{/* Main content */}
			<div className="flex-1 relative overflow-hidden">
				{error && (
					<div className="absolute inset-0 flex items-center justify-center p-4">
						<div className="bg-red-500 text-white p-4 rounded-lg max-w-sm text-center">
							<p>{error}</p>
							{hasPermission === false && (
								<button
									type="button"
									onClick={startCamera}
									className="mt-2 bg-white text-red-500 px-4 py-2 rounded-lg"
								>
									Try Again
								</button>
							)}
						</div>
					</div>
				)}

				{isLoading && !error && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-white text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
							<p>Starting camera...</p>
						</div>
					</div>
				)}

				{/* Camera preview */}
				{!capturedImage && (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="w-full h-full object-cover"
						style={{ transform: "scaleX(-1)" }} // Mirror for selfie mode
					/>
				)}

				{/* Captured image preview */}
				{capturedImage && (
					/* biome-ignore lint/performance/noImgElement: Need img for blob URL preview */
					<img
						src={capturedImage}
						alt="Captured"
						className="w-full h-full object-cover"
					/>
				)}

				{/* Hidden canvas for capture */}
				<canvas ref={canvasRef} className="hidden" />
			</div>

			{/* Controls */}
			<div className="bg-black/50 p-4">
				{!capturedImage ? (
					<div className="flex items-center justify-center gap-4">
						{/* Switch camera button */}
						<button
							type="button"
							onClick={switchCamera}
							className="p-4 text-white hover:bg-white/20 rounded-full transition-colors"
							aria-label="Switch camera"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						</button>

						{/* Capture button */}
						<button
							type="button"
							onClick={handleCapture}
							disabled={isLoading || !!error}
							className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label="Take photo"
						>
							<span className="sr-only">Capture</span>
						</button>

						{/* Placeholder for symmetry */}
						<div className="w-14 h-14" />
					</div>
				) : (
					<div className="flex items-center justify-center gap-4">
						{/* Retake button */}
						<button
							type="button"
							onClick={handleRetake}
							className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							Retake
						</button>

						{/* Use photo button */}
						<button
							type="button"
							onClick={handleConfirm}
							className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							Use Photo
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
