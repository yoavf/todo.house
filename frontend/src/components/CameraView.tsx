import { ImageIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageAnalysisResponse } from "@/lib/api";
import { tasksAPI } from "@/lib/api";
import { ImageProcessing } from "./ImageProcessing";

interface CameraViewProps {
	isOpen: boolean;
	onClose: () => void;
	onTasksGenerated?: (response: ImageAnalysisResponse) => void;
}

export function CameraView({
	isOpen,
	onClose,
	onTasksGenerated,
}: CameraViewProps) {
	const [isCapturing, setIsCapturing] = useState(false);
	const [processingState, setProcessingState] = useState<
		null | "processing" | "results"
	>(null);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [isApiComplete, setIsApiComplete] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [isZooming, setIsZooming] = useState(false);
	const [zoomConstraints, setZoomConstraints] = useState<{
		min: number;
		max: number;
		step: number;
	} | null>(null);
	const [supportsZoom, setSupportsZoom] = useState(false);
	const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
		null,
	);
	const [visualZoom, setVisualZoom] = useState(1);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Calculate distance between two touch points
	const getTouchDistance = useCallback((touches: React.TouchList): number => {
		if (touches.length < 2) return 0;
		const touch1 = touches[0];
		const touch2 = touches[1];
		return Math.sqrt(
			(touch2.clientX - touch1.clientX) ** 2 +
				(touch2.clientY - touch1.clientY) ** 2,
		);
	}, []);

	// Apply zoom to camera stream using MediaStream API
	const applyCameraZoom = useCallback(
		async (newZoomLevel: number) => {
			if (!stream || !supportsZoom || !zoomConstraints) return false;

			try {
				const videoTrack = stream.getVideoTracks()[0];
				if (!videoTrack) return false;

				const clampedZoom = Math.max(
					zoomConstraints.min,
					Math.min(zoomConstraints.max, newZoomLevel),
				);

				await videoTrack.applyConstraints({
					advanced: [{ zoom: clampedZoom } as any],
				});

				setZoomLevel(clampedZoom);
				return true;
			} catch (error) {
				console.warn("Camera zoom not supported:", error);
				return false;
			}
		},
		[stream, supportsZoom, zoomConstraints],
	);

	// Handle zoom change with fallback to visual zoom
	const handleZoomChange = useCallback(
		async (newZoomLevel: number) => {
			const cameraZoomApplied = await applyCameraZoom(newZoomLevel);

			if (!cameraZoomApplied) {
				// Fall back to visual zoom using CSS transforms
				const clampedVisualZoom = Math.max(1, Math.min(3, newZoomLevel));
				setVisualZoom(clampedVisualZoom);
			}
		},
		[applyCameraZoom],
	);

	// Handle touch start for zoom gesture
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				const distance = getTouchDistance(e.touches);
				setLastTouchDistance(distance);
				setIsZooming(true);
			}
		},
		[getTouchDistance],
	);

	// Handle touch move for zoom gesture
	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2 && lastTouchDistance !== null && isZooming) {
				e.preventDefault();
				const currentDistance = getTouchDistance(e.touches);
				const zoomFactor = currentDistance / lastTouchDistance;

				const currentZoom = supportsZoom ? zoomLevel : visualZoom;
				const newZoom = currentZoom * zoomFactor;

				handleZoomChange(newZoom);
				setLastTouchDistance(currentDistance);
			}
		},
		[
			lastTouchDistance,
			isZooming,
			getTouchDistance,
			zoomLevel,
			visualZoom,
			supportsZoom,
			handleZoomChange,
		],
	);

	// Handle touch end for zoom gesture
	const handleTouchEnd = useCallback((e: React.TouchEvent) => {
		if (e.touches.length < 2) {
			setIsZooming(false);
			setLastTouchDistance(null);
		}
	}, []);

	// Manual zoom controls
	const zoomIn = useCallback(() => {
		const currentZoom = supportsZoom ? zoomLevel : visualZoom;
		const step = zoomConstraints?.step || 0.1;
		handleZoomChange(currentZoom + step);
	}, [supportsZoom, zoomLevel, visualZoom, zoomConstraints, handleZoomChange]);

	const zoomOut = useCallback(() => {
		const currentZoom = supportsZoom ? zoomLevel : visualZoom;
		const step = zoomConstraints?.step || 0.1;
		handleZoomChange(currentZoom - step);
	}, [supportsZoom, zoomLevel, visualZoom, zoomConstraints, handleZoomChange]);

	// Reset zoom
	const resetZoom = useCallback(() => {
		handleZoomChange(1);
	}, [handleZoomChange]);

	// Check camera zoom capabilities
	const checkZoomCapabilities = useCallback(
		async (videoTrack: MediaStreamTrack) => {
			try {
				const capabilities = videoTrack.getCapabilities();
				// TypeScript doesn't include zoom in MediaTrackCapabilities, but some browsers support it
				const zoomCapability = (capabilities as any).zoom;
				if (zoomCapability) {
					setSupportsZoom(true);
					setZoomConstraints({
						min: zoomCapability.min || 1,
						max: zoomCapability.max || 3,
						step: zoomCapability.step || 0.1,
					});
				} else {
					// Use visual zoom as fallback
					setSupportsZoom(false);
					setZoomConstraints({
						min: 1,
						max: 3,
						step: 0.1,
					});
				}
			} catch (error) {
				console.warn("Could not get camera capabilities:", error);
				// Use visual zoom as fallback
				setSupportsZoom(false);
				setZoomConstraints({
					min: 1,
					max: 3,
					step: 0.1,
				});
			}
		},
		[],
	);

	// Reset state when closing
	useEffect(() => {
		if (!isOpen) {
			setProcessingState(null);
			// Revoke the object URL before clearing it
			if (capturedImageUrl) {
				URL.revokeObjectURL(capturedImageUrl);
			}
			setCapturedImageUrl(null);
			setAnalysisResponse(null);
			setIsApiComplete(false);
			setCameraError(null);
			// Reset zoom state
			setZoomLevel(1);
			setVisualZoom(1);
			setIsZooming(false);
			setLastTouchDistance(null);
			setSupportsZoom(false);
			setZoomConstraints(null);
			// Clear zoom timeout
			if (zoomTimeoutRef.current) {
				clearTimeout(zoomTimeoutRef.current);
				zoomTimeoutRef.current = null;
			}
			// Stop camera stream
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
				setStream(null);
			}
		}
	}, [isOpen, stream, capturedImageUrl]);

	// Clean up object URLs when capturedImageUrl changes or component unmounts
	useEffect(() => {
		return () => {
			if (capturedImageUrl) {
				URL.revokeObjectURL(capturedImageUrl);
			}
		};
	}, [capturedImageUrl]);

	// Start camera when opening
	useEffect(() => {
		if (isOpen && !processingState) {
			const start = async () => {
				try {
					// Check if mediaDevices is available (requires HTTPS or localhost)
					if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
						setCameraError(
							"Camera access requires HTTPS. Please use localhost or upload a photo instead.",
						);
						return;
					}

					const mediaStream = await navigator.mediaDevices.getUserMedia({
						video: { facingMode: "environment" },
						audio: false,
					});
					setStream(mediaStream);

					// Check zoom capabilities
					const videoTrack = mediaStream.getVideoTracks()[0];
					if (videoTrack) {
						await checkZoomCapabilities(videoTrack);
					}

					if (videoRef.current) {
						videoRef.current.srcObject = mediaStream;
					}
				} catch (error) {
					console.error("Camera access error:", error);
					if (error instanceof Error && error.name === "NotAllowedError") {
						setCameraError(
							"Camera permission denied. Please check your browser settings.",
						);
					} else {
						setCameraError(
							"Unable to access camera. Please check permissions or use HTTPS.",
						);
					}
				}
			};
			start();
		}
	}, [isOpen, processingState, checkZoomCapabilities]);

	const capturePhoto = async () => {
		if (!videoRef.current || !canvasRef.current) return;

		// Trigger flash effect
		setIsCapturing(true);

		// Wait a brief moment for the flash effect to show
		await new Promise((resolve) => setTimeout(resolve, 100));

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) return;

		// Set canvas size to video size
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		context.drawImage(video, 0, 0);

		// Remove flash effect after capture
		setIsCapturing(false);

		// Convert canvas to blob
		canvas.toBlob(
			async (blob) => {
				if (!blob) {
					// Stop camera stream even if blob creation fails
					if (stream) {
						stream.getTracks().forEach((track) => track.stop());
						setStream(null);
					}
					alert("Failed to capture photo. Please try again.");
					return;
				}

				// Create a File object from the blob
				const file = new File([blob], `capture-${Date.now()}.jpg`, {
					type: "image/jpeg",
				});

				// Create preview URL
				const url = URL.createObjectURL(blob);
				setCapturedImageUrl(url);

				// Stop camera stream
				if (stream) {
					stream.getTracks().forEach((track) => track.stop());
					setStream(null);
				}

				// Start processing
				setProcessingState("processing");

				try {
					const response = await tasksAPI.analyzeImage(file);
					setAnalysisResponse(response);
					setIsApiComplete(true);
				} catch (error) {
					console.error("Failed to analyze image:", error);
					setProcessingState(null);
					// Revoke the object URL before clearing it
					if (url) {
						URL.revokeObjectURL(url);
					}
					setCapturedImageUrl(null);
					setAnalysisResponse(null);
					setIsApiComplete(false);
					alert("Failed to analyze image. Please try again.");
				}
			},
			"image/jpeg",
			0.9,
		);
	};

	const handleCapture = () => {
		if (stream && videoRef.current) {
			capturePhoto();
		} else {
			fileInputRef.current?.click();
		}
	};

	const handleSelectFromDevice = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Create a URL for preview
		const url = URL.createObjectURL(file);
		setCapturedImageUrl(url);

		// Start processing
		setProcessingState("processing");

		try {
			const response = await tasksAPI.analyzeImage(file);
			setAnalysisResponse(response);
			setIsApiComplete(true);
		} catch (error) {
			console.error("Failed to analyze image:", error);
			// Reset state on error
			setProcessingState(null);
			// Revoke the object URL before clearing it
			if (url) {
				URL.revokeObjectURL(url);
			}
			setCapturedImageUrl(null);
			setAnalysisResponse(null);
			setIsApiComplete(false);
			alert("Failed to analyze image. Please try again.");
		}

		// Clear the input so the same file can be selected again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleProcessingComplete = () => {
		// Only show results if we have the API response
		if (isApiComplete && analysisResponse) {
			setProcessingState("results");
		} else {
			// If API isn't done yet, wait and keep checking
			const checkInterval = setInterval(() => {
				if (isApiComplete && analysisResponse) {
					clearInterval(checkInterval);
					setProcessingState("results");
				}
			}, 500);
		}
	};

	// Handle completion after results are ready
	useEffect(() => {
		if (processingState === "results" && analysisResponse) {
			// Pass the response to parent and close
			onTasksGenerated?.(analysisResponse);
			onClose();
		}
	}, [processingState, analysisResponse, onTasksGenerated, onClose]);

	// Keyboard shortcuts for zoom
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen || processingState) return;

			switch (e.key) {
				case "+":
				case "=":
					e.preventDefault();
					zoomIn();
					break;
				case "-":
					e.preventDefault();
					zoomOut();
					break;
				case "0":
					e.preventDefault();
					resetZoom();
					break;
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, processingState, zoomIn, zoomOut, resetZoom]);

	if (!isOpen) return null;

	// Show processing screen if in processing state
	if (processingState === "processing") {
		return (
			<ImageProcessing
				imageUrl={capturedImageUrl || ""}
				onComplete={handleProcessingComplete}
			/>
		);
	}

	// Show nothing while transitioning to results
	if (processingState === "results") {
		return null;
	}

	// Otherwise show camera view
	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col">
			{/* Camera viewfinder */}
			<div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
				{/* Live camera feed or error message */}
				{cameraError ? (
					<div className="text-white text-center p-4">
						<p className="mb-4">{cameraError}</p>
						<button
							type="button"
							className="px-4 py-2 bg-orange-500 text-white rounded-lg"
							onClick={() => fileInputRef.current?.click()}
						>
							Select Photo Instead
						</button>
					</div>
				) : (
					<>
						<div
							className="absolute inset-0 w-full h-full overflow-hidden"
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
						>
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
								style={{
									transform: !supportsZoom ? `scale(${visualZoom})` : undefined,
									transformOrigin: "center",
								}}
							/>
						</div>
						<canvas ref={canvasRef} className="hidden" />
					</>
				)}
				{/* Camera UI elements */}
				<div className="absolute inset-0 pointer-events-none">
					{/* Corner markers to indicate viewfinder - narrower frame */}
					<div className="absolute top-20 left-12 w-12 h-12 border-l-2 border-t-2 border-white opacity-60"></div>
					<div className="absolute top-20 right-12 w-12 h-12 border-r-2 border-t-2 border-white opacity-60"></div>
					<div className="absolute bottom-20 left-12 w-12 h-12 border-l-2 border-b-2 border-white opacity-60"></div>
					<div className="absolute bottom-20 right-12 w-12 h-12 border-r-2 border-b-2 border-white opacity-60"></div>
				</div>
				{/* Flash effect when capturing */}
				{isCapturing && (
					<div className="absolute inset-0 bg-white animate-flash"></div>
				)}
				{/* Close button */}
				<button
					type="button"
					className="absolute top-4 right-4 p-4 bg-black/50 text-white rounded-full"
					onClick={onClose}
				>
					<XIcon size={28} />
				</button>

				{/* Zoom controls */}
				{zoomConstraints && (
					<div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
						<button
							type="button"
							className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
							onClick={zoomIn}
							disabled={isZooming}
							aria-label="Zoom in"
						>
							<ZoomInIcon size={20} />
						</button>
						<button
							type="button"
							className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
							onClick={zoomOut}
							disabled={isZooming}
							aria-label="Zoom out"
						>
							<ZoomOutIcon size={20} />
						</button>
						<button
							type="button"
							className="px-2 py-1 bg-black/50 text-white text-xs rounded-full hover:bg-black/70 transition-colors"
							onClick={resetZoom}
							disabled={isZooming}
							aria-label="Reset zoom"
						>
							1x
						</button>
					</div>
				)}

				{/* Zoom level indicator */}
				{zoomConstraints && (supportsZoom ? zoomLevel : visualZoom) > 1.1 && (
					<div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
						{(supportsZoom ? zoomLevel : visualZoom).toFixed(1)}x
					</div>
				)}
				{/* Capture hint text */}
				<div className="absolute top-4 left-0 right-0 text-center">
					<p className="text-white/70 text-base">
						Take a photo of what needs attention
					</p>
					{zoomConstraints && (
						<p className="text-white/50 text-xs mt-1">
							Pinch to zoom • Use +/- keys • Tap zoom controls
						</p>
					)}
				</div>
			</div>
			{/* Bottom controls */}
			<div className="h-24 bg-black flex items-center justify-center relative">
				{/* Capture button */}
				<button
					type="button"
					className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
					onClick={handleCapture}
				>
					<div className="w-14 h-14 rounded-full bg-white"></div>
				</button>
				{/* Select from device button */}
				<button
					type="button"
					className="absolute right-8 w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white"
					onClick={handleSelectFromDevice}
				>
					<ImageIcon size={20} />
				</button>
			</div>
			{/* Hidden file input with camera capture for mobile */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="hidden"
				onChange={handleFileSelected}
			/>
		</div>
	);
}
