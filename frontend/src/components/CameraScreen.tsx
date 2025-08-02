"use client";

import { CameraIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";
import { type ImageAnalysisResponse, tasksAPI } from "@/lib/api";

interface CameraScreenProps {
	isOpen: boolean;
	onClose: () => void;
	onTasksGenerated: (response: ImageAnalysisResponse) => void;
}

export function CameraScreen({
	isOpen,
	onClose,
	onTasksGenerated,
}: CameraScreenProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setError(null);

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCapture = () => {
		// For mobile devices, this will open camera
		fileInputRef.current?.click();
	};

	const handleAnalyze = async () => {
		if (!selectedFile) return;

		setIsAnalyzing(true);
		setError(null);

		try {
			const response = await tasksAPI.analyzeImage(selectedFile);
			onTasksGenerated(response);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to analyze image");
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleCancel = () => {
		setSelectedFile(null);
		setPreview(null);
		setError(null);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-xl font-semibold">Capture Home Task</h2>
					<button
						type="button"
						onClick={handleCancel}
						className="p-2 hover:bg-gray-100 rounded-full"
					>
						<XIcon size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="p-4">
					{!preview ? (
						// Initial state - show capture options
						<div className="space-y-4">
							<p className="text-gray-600 text-sm text-center mb-6">
								Take a photo or select an image to generate tasks
							</p>

							<button
								type="button"
								onClick={handleCapture}
								className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-colors"
							>
								<CameraIcon size={48} className="mx-auto mb-3 text-gray-400" />
								<p className="text-gray-600 font-medium">Take Photo</p>
								<p className="text-gray-400 text-sm mt-1">Use your camera</p>
							</button>

							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-colors"
							>
								<ImageIcon size={48} className="mx-auto mb-3 text-gray-400" />
								<p className="text-gray-600 font-medium">Choose from Gallery</p>
								<p className="text-gray-400 text-sm mt-1">
									Select existing photo
								</p>
							</button>

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								capture="environment"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>
					) : (
						// Preview state - show selected image
						<div className="space-y-4">
							<div className="relative rounded-xl overflow-hidden h-[400px] bg-gray-100">
								<Image
									src={preview}
									alt="Selected"
									fill
									className="object-contain"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								/>
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-red-600 text-sm">{error}</p>
								</div>
							)}

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setPreview(null);
										setSelectedFile(null);
									}}
									className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
									disabled={isAnalyzing}
								>
									Retake
								</button>
								<button
									type="button"
									onClick={handleAnalyze}
									disabled={isAnalyzing}
									className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								>
									{isAnalyzing ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Analyzing...
										</>
									) : (
										<>
											<UploadIcon size={16} className="mr-2" />
											Analyze
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
