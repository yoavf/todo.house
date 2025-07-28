"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
	onCapture: (file: File) => void;
	onError: (error: string) => void;
	onClose: () => void;
	isOpen: boolean;
}

export function CameraCapture({
	onCapture,
	onError,
	onClose,
	isOpen,
}: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [isStreaming, setIsStreaming] = useState(false);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [facingMode, setFacingMode] = useState<"user" | "environment">(
		"environment",
	);

	// Check if device has camera support
	const isCameraSupported = useCallback(() => {
		return !!navigator.mediaDevices?.getUserMedia;
	}, []);

	// Start camera stream
	const startCamera = useCallback(async () => {
		if (!isCameraSupported()) {
			onError("Camera is not supported on this device");
			return;
		}

		try {
			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: facingMode,
					width: { ideal: 1920, max: 1920 },
					height: { ideal: 1080, max: 1080 },
				},
				audio: false,
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();
				setIsStreaming(true);
				setHasPermission(true);
			}
		} catch (error) {
			console.error("Error accessing camera:", error);
			setHasPermission(false);

			if (error instanceof Error) {
				if (error.name === "NotAllowedError") {
					onError(
						"Camera access denied. Please allow camera access and try again, or use file upload instead.",
					);
				} else if (error.name === "NotFoundError") {
					onError(
						"No camera found on this device. Please use file upload instead.",
					);
				} else if (error.name === "NotSupportedError") {
					onError(
						"Camera is not supported on this device. Please use file upload instead.",
					);
				} else {
					onError("Failed to access camera. Please try file upload instead.");
				}
			} else {
				onError("Failed to access camera. Please try file upload instead.");
			}
		}
	}, [facingMode, isCameraSupported, onError]);

	// Stop camera stream
	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setIsStreaming(false);
	}, []);

	// Capture photo
	const capturePhoto = useCallback(() => {
		if (!videoRef.current || !canvasRef.current || !isStreaming) {
			onError("Camera is not ready");
			return;
		}

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) {
			onError("Failed to capture photo");
			return;
		}

		// Set canvas dimensions to match video
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Convert canvas to blob
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					onError("Failed to capture photo");
					return;
				}

				// Create file from blob
				const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
				const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
					type: "image/jpeg",
					lastModified: Date.now(),
				});

				onCapture(file);
				onClose();
			},
			"image/jpeg",
			0.9,
		);
	}, [isStreaming, onCapture, onClose, onError]);

	// Switch camera (front/back)
	const switchCamera = useCallback(() => {
		const newFacingMode = facingMode === "user" ? "environment" : "user";
		setFacingMode(newFacingMode);

		// Restart camera with new facing mode
		if (isStreaming) {
			stopCamera();
			setTimeout(() => {
				startCamera();
			}, 100);
		}
	}, [facingMode, isStreaming, stopCamera, startCamera]);

	// Start camera when component opens
	useEffect(() => {
		if (isOpen && !isStreaming && hasPermission !== false) {
			startCamera();
		}
	}, [isOpen, isStreaming, hasPermission, startCamera]);

	// Cleanup on unmount or close
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	// Close handler
	const handleClose = useCallback(() => {
		stopCamera();
		onClose();
	}, [stopCamera, onClose]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<h3 className="text-lg font-semibold">Capture Photo</h3>
					<button
						type="button"
						onClick={handleClose}
						className="text-gray-500 hover:text-gray-700 text-xl"
						aria-label="Close camera"
					>
						×
					</button>
				</div>

				{/* Camera View */}
				<div className="relative">
					{isStreaming ? (
						<>
							<video
								ref={videoRef}
								className="w-full h-64 sm:h-80 object-cover bg-black"
								playsInline
								muted
							/>

							{/* Camera Controls Overlay */}
							<div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4">
								{/* Switch Camera Button */}
								<button
									type="button"
									onClick={switchCamera}
									className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
									aria-label="Switch camera"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="Switch camera icon"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
										/>
									</svg>
								</button>

								{/* Capture Button */}
								<button
									type="button"
									onClick={capturePhoto}
									className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors"
									aria-label="Capture photo"
								>
									<svg
										className="w-8 h-8"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="Camera capture icon"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</button>
							</div>
						</>
					) : (
						<div className="h-64 sm:h-80 bg-gray-100 flex items-center justify-center">
							<div className="text-center">
								{hasPermission === false ? (
									<>
										<div className="text-red-500 mb-2">
											<svg
												className="w-12 h-12 mx-auto"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Camera access denied warning icon"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
												/>
											</svg>
										</div>
										<p className="text-gray-600 mb-4">Camera access denied</p>
										<button
											type="button"
											onClick={startCamera}
											className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
										>
											Try Again
										</button>
									</>
								) : (
									<>
										<div className="text-gray-400 mb-2">
											<svg
												className="w-12 h-12 mx-auto"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Camera starting icon"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
												/>
											</svg>
										</div>
										<p className="text-gray-600">Starting camera...</p>
									</>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t bg-gray-50">
					<p className="text-sm text-gray-600 text-center">
						Position your camera to capture the area you want to analyze for
						maintenance tasks
					</p>
				</div>
			</div>

			{/* Hidden canvas for photo capture */}
			<canvas ref={canvasRef} className="hidden" />
		</div>
	);
}
