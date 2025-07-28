import { useCallback, useEffect, useRef, useState } from "react";

interface UseCameraOptions {
	onError?: (error: string) => void;
	facingMode?: "user" | "environment";
}

interface UseCameraReturn {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	stream: MediaStream | null;
	isLoading: boolean;
	error: string | null;
	hasPermission: boolean | null;
	startCamera: () => Promise<void>;
	stopCamera: () => void;
	capturePhoto: () => Promise<Blob | null>;
	switchCamera: () => Promise<void>;
}

export function useCamera({
	onError,
	facingMode = "environment",
}: UseCameraOptions = {}): UseCameraReturn {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

	const stopCamera = useCallback(() => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}, [stream]);

	const startCamera = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Request camera permissions
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: currentFacingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});

			setStream(mediaStream);
			setHasPermission(true);

			// Attach stream to video element
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
				// Ensure video plays
				await videoRef.current.play();
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to access camera";

			// Handle specific error cases
			if (errorMessage.includes("Permission denied")) {
				setError("Camera permission denied. Please allow camera access.");
				setHasPermission(false);
			} else if (errorMessage.includes("NotFoundError")) {
				setError("No camera found on this device.");
			} else if (errorMessage.includes("NotAllowedError")) {
				setError(
					"Camera access not allowed. Please check your browser settings.",
				);
				setHasPermission(false);
			} else {
				setError(errorMessage);
			}

			onError?.(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentFacingMode, onError]);

	const capturePhoto = useCallback(async (): Promise<Blob | null> => {
		if (!videoRef.current || !canvasRef.current) {
			setError("Camera not ready");
			return null;
		}

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) {
			setError("Canvas context not available");
			return null;
		}

		// Set canvas dimensions to match video
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		context.drawImage(video, 0, 0);

		// Convert canvas to blob
		return new Promise((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						setError("Failed to capture photo");
						resolve(null);
					}
				},
				"image/jpeg",
				0.85, // 85% quality
			);
		});
	}, []);

	const switchCamera = useCallback(async () => {
		const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
		setCurrentFacingMode(newFacingMode);

		// Stop current stream
		stopCamera();

		// Start with new facing mode
		await startCamera();
	}, [currentFacingMode, stopCamera, startCamera]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	return {
		videoRef,
		canvasRef,
		stream,
		isLoading,
		error,
		hasPermission,
		startCamera,
		stopCamera,
		capturePhoto,
		switchCamera,
	};
}
