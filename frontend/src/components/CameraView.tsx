import { ImageIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
	const [isCapturing] = useState(false);
	const [processingState, setProcessingState] = useState<
		null | "processing" | "results"
	>(null);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [analysisResponse, setAnalysisResponse] =
		useState<ImageAnalysisResponse | null>(null);
	const [isApiComplete, setIsApiComplete] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Reset state when closing
	useEffect(() => {
		if (!isOpen) {
			setProcessingState(null);
			setCapturedImageUrl(null);
			setAnalysisResponse(null);
			setIsApiComplete(false);
			setCameraError(null);
			// Stop camera stream
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
				setStream(null);
			}
		}
	}, [isOpen, stream]);

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
	}, [isOpen, processingState]);


	const capturePhoto = async () => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) return;

		// Set canvas size to video size
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		context.drawImage(video, 0, 0);

		// Convert canvas to blob
		canvas.toBlob(
			async (blob) => {
				if (!blob) return;

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
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="absolute inset-0 w-full h-full object-cover"
						/>
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
				{/* Capture hint text */}
				<div className="absolute top-4 left-0 right-0 text-center">
					<p className="text-white/70 text-base">
						Take a photo of what needs attention
					</p>
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
