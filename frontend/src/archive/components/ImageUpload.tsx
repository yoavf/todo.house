"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { type ImageAnalysisResponse, tasksAPI } from "@/lib/api";
import { CameraCapture } from "./CameraCapture";
import { Icons } from "./icons";

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
			<Card className="hover:shadow-xl transition-shadow duration-300">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold text-gray-800 flex items-center">
						<Icons.image
							className="w-6 h-6 mr-2 text-green-600"
							aria-label="Image"
						/>
						Generate Tasks from Image
					</CardTitle>
				</CardHeader>

				<CardContent>
					{!selectedFile ? (
						<div className="space-y-4">
							{/* File Upload Area */}
							<Button
								type="button"
								variant="ghost"
								className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all w-full group h-auto ${
									dragActive
										? "border-blue-500 bg-blue-50 scale-[1.02]"
										: "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
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
								<Input
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleFileInput}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									disabled={isProcessing}
								/>

								<div className="space-y-3 sm:space-y-4">
									<div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 group-hover:text-gray-600 transition-colors">
										<Icons.upload aria-label="Upload icon" />
									</div>
									<div>
										<p className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-gray-900">
											{isMobile
												? "Tap to select an image"
												: "Drop an image here, or click to select"}
										</p>
										<p className="text-sm text-gray-500 mt-2">
											Supports JPEG, PNG, and WebP files up to 10MB
										</p>
									</div>
								</div>
							</Button>

							{/* Camera Button for Mobile */}
							{isMobile && (
								<div className="flex items-center space-x-3">
									<div className="flex-1 border-t border-gray-300"></div>
									<span className="text-sm text-gray-500 px-3">or</span>
									<div className="flex-1 border-t border-gray-300"></div>
								</div>
							)}

							{isMobile && (
								<Button
									type="button"
									onClick={() => setShowCamera(true)}
									disabled={isProcessing}
									className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
								>
									<Icons.camera className="w-5 h-5" aria-label="Camera icon" />
									<span>Take Photo</span>
								</Button>
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
									className="w-full max-h-48 sm:max-h-64 object-contain rounded-xl border-2 border-gray-200 shadow-sm"
								/>
								<Button
									type="button"
									onClick={handleClear}
									variant="destructive"
									size="icon"
									className="absolute top-3 right-3 rounded-full w-8 h-8 flex items-center justify-center text-lg font-medium shadow-md"
									disabled={isProcessing}
									aria-label="Clear image"
								>
									×
								</Button>
							</div>

							{/* File Info */}
							<div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
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
								<div className="space-y-3">
									<div className="flex justify-between text-sm font-medium text-gray-700">
										<span className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
											Analyzing image...
										</span>
										<span className="text-blue-600">{progress}%</span>
									</div>
									<Progress value={progress} className="w-full h-3" />
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row gap-3">
								<Button
									type="button"
									onClick={handleAnalyze}
									disabled={isProcessing}
									className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
								>
									{isProcessing ? "Analyzing..." : "Generate Tasks"}
								</Button>
								<Button
									type="button"
									onClick={handleClear}
									disabled={isProcessing}
									variant="outline"
									className="px-6 py-3 rounded-xl font-medium"
								>
									Clear
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

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
