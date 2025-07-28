"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "./icons";

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
									<Icons.switchCamera
										className="w-6 h-6"
										aria-label="Switch camera"
									/>
								</button>

								{/* Capture Button */}
								<button
									type="button"
									onClick={capturePhoto}
									className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors"
									aria-label="Capture photo"
								>
									<Icons.camera
										className="w-8 h-8"
										aria-label="Camera capture"
									/>
								</button>
							</div>
						</>
					) : (
						<div className="h-64 sm:h-80 bg-gray-100 flex items-center justify-center">
							<div className="text-center">
								{hasPermission === false ? (
									<>
										<div className="text-red-500 mb-2">
											<Icons.error
												className="w-12 h-12 mx-auto"
												aria-label="Camera access denied"
											/>
										</div>
										<p className="text-gray-600 mb-4">Camera access denied</p>
										<Button
											type="button"
											onClick={startCamera}
											className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
										>
											Try Again
										</Button>
									</>
								) : (
									<>
										<div className="text-gray-400 mb-2">
											<Icons.camera
												className="w-12 h-12 mx-auto"
												aria-label="Camera starting"
											/>
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
