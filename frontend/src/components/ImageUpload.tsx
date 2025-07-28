"use client";

import { useCallback, useEffect, useState } from "react";
import { type ImageAnalysisResponse, tasksAPI } from "@/lib/api";
import { CameraCapture } from "./CameraCapture";

interface ImageUploadProps {
	onTasksGenerated?: (response: ImageAnalysisResponse) => void;
	onError?: (error: string) => void;
}

export function ImageUpload({ onTasksGenerated, onError }: ImageUploadProps) {
	const [dragActive, setDragActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [showCamera, setShowCamera] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Detect if user is on mobile device
	useEffect(() => {
		const checkMobile = () => {
			const userAgent = navigator.userAgent.toLowerCase();
			const isMobileDevice =
				/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
					userAgent,
				);
			const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
			const isSmallScreen = window.innerWidth <= 768;

			setIsMobile(isMobileDevice || (hasTouch && isSmallScreen));
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return;

			const file = files[0];

			// Validate file type
			const validTypes = ["image/jpeg", "image/png", "image/webp"];
			if (!validTypes.includes(file.type)) {
				onError?.("Please select a valid image file (JPEG, PNG, or WebP)");
				return;
			}

			// Validate file size (10MB max)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				onError?.("Image file is too large. Please select a file under 10MB.");
				return;
			}

			setSelectedFile(file);

			// Create preview URL
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		},
		[onError],
	);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);

			if (e.dataTransfer.files?.[0]) {
				handleFiles(e.dataTransfer.files);
			}
		},
		[handleFiles],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleFiles(e.target.files);
		},
		[handleFiles],
	);

	const handleAnalyze = async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		setProgress(0);

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 90) {
					clearInterval(progressInterval);
					return prev;
				}
				return prev + 10;
			});
		}, 200);

		try {
			const response = await tasksAPI.analyzeImage(selectedFile);
			setProgress(100);
			onTasksGenerated?.(response);

			// Reset form after successful analysis
			setTimeout(() => {
				setSelectedFile(null);
				setPreviewUrl(null);
				setProgress(0);
			}, 1000);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to analyze image";
			onError?.(errorMessage);
		} finally {
			clearInterval(progressInterval);
			setIsProcessing(false);
		}
	};

	const handleClear = () => {
		setSelectedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		setProgress(0);
	};

	const handleCameraCapture = useCallback(
		(file: File) => {
			handleFiles([file] as unknown as FileList);
			setShowCamera(false);
		},
		[handleFiles],
	);

	const handleCameraError = useCallback(
		(error: string) => {
			onError?.(error);
			setShowCamera(false);
		},
		[onError],
	);

	return (
		<div className="w-full max-w-2xl mx-auto">
			{/* Main image upload container */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
				<h2 className="text-lg sm:text-xl font-semibold mb-4">
					Generate Tasks from Image
				</h2>

				{!selectedFile ? (
					<div className="space-y-4">
						{/* File Upload Area */}
						<button
							type="button"
							className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors w-full ${
								dragActive
									? "border-blue-400 bg-blue-50"
									: "border-gray-300 hover:border-gray-400"
							}`}
							onDragEnter={handleDrag}
							onDragLeave={handleDrag}
							onDragOver={handleDrag}
							onDrop={handleDrop}
							onClick={() => {
								const input = document.querySelector(
									'input[type="file"]',
								) as HTMLInputElement;
								input?.click();
							}}
							disabled={isProcessing}
						>
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onChange={handleFileInput}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								disabled={isProcessing}
							/>

							<div className="space-y-3 sm:space-y-4">
								<div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-gray-400">
									<svg
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="Upload icon"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
								</div>
								<div>
									<p className="text-base sm:text-lg font-medium text-gray-900">
										{isMobile
											? "Tap to select an image"
											: "Drop an image here, or click to select"}
									</p>
									<p className="text-xs sm:text-sm text-gray-500 mt-1">
										Supports JPEG, PNG, and WebP files up to 10MB
									</p>
								</div>
							</div>
						</button>

						{/* Camera Button for Mobile */}
						{isMobile && (
							<div className="flex items-center space-x-3">
								<div className="flex-1 border-t border-gray-300"></div>
								<span className="text-sm text-gray-500 px-3">or</span>
								<div className="flex-1 border-t border-gray-300"></div>
							</div>
						)}

						{isMobile && (
							<button
								type="button"
								onClick={() => setShowCamera(true)}
								disabled={isProcessing}
								className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									role="img"
									aria-label="Camera icon"
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
								<span>Take Photo</span>
							</button>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{/* Image Preview */}
						<div className="relative">
							{/* biome-ignore lint/performance/noImgElement: Need img for blob URL preview */}
							<img
								src={previewUrl || ""}
								alt="Preview"
								className="w-full max-h-48 sm:max-h-64 object-contain rounded-lg border border-gray-200"
							/>
							<button
								type="button"
								onClick={handleClear}
								className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
								disabled={isProcessing}
								aria-label="Clear image"
							>
								×
							</button>
						</div>

						{/* File Info */}
						<div className="text-xs sm:text-sm text-gray-600 space-y-1">
							<p className="truncate">
								<strong>File:</strong> {selectedFile.name}
							</p>
							<div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
								<p>
									<strong>Size:</strong>{" "}
									{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
								</p>
								<p>
									<strong>Type:</strong> {selectedFile.type}
								</p>
							</div>
						</div>

						{/* Progress Bar */}
						{isProcessing && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm text-gray-600">
									<span>Analyzing image...</span>
									<span>{progress}%</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-500 h-2 rounded-full transition-all duration-300"
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-3">
							<button
								type="button"
								onClick={handleAnalyze}
								disabled={isProcessing}
								className="flex-1 bg-blue-500 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
							>
								{isProcessing ? "Analyzing..." : "Generate Tasks"}
							</button>
							<button
								type="button"
								onClick={handleClear}
								disabled={isProcessing}
								className="sm:w-auto px-4 py-3 sm:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
							>
								Clear
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Camera Capture Modal */}
			<CameraCapture
				isOpen={showCamera}
				onCapture={handleCameraCapture}
				onError={handleCameraError}
				onClose={() => setShowCamera(false)}
			/>
		</div>
	);
}
