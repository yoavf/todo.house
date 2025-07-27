"use client";

import { useState } from "react";
import { type ImageAnalysisResult, imageAPI } from "@/lib/api";
import { ImageUpload } from "./ImageUpload";

export function ImageAnalyzer() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [analysisResult, setAnalysisResult] =
		useState<ImageAnalysisResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleImageSelect = (file: File) => {
		setSelectedFile(file);
		setError(null);
		setAnalysisResult(null);

		// Create preview URL
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
	};

	const handleAnalyze = async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		setError(null);

		try {
			const result = await imageAPI.analyzeImage(selectedFile);
			setAnalysisResult(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleClear = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setSelectedFile(null);
		setPreviewUrl(null);
		setAnalysisResult(null);
		setError(null);
	};

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 className="text-xl font-semibold mb-4">Image Analysis</h2>

				{!selectedFile ? (
					<ImageUpload
						onImageSelect={handleImageSelect}
						isProcessing={isProcessing}
					/>
				) : (
					<div className="space-y-4">
						{/* Image Preview */}
						<div className="relative">
							{/* biome-ignore lint/performance/noImgElement: Image preview for uploaded file */}
							<img
								src={previewUrl || ""}
								alt="Selected file preview"
								className="w-full max-h-96 object-contain rounded-lg bg-gray-100"
							/>
							{!isProcessing && !analysisResult && (
								<button
									type="button"
									onClick={handleClear}
									className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
									aria-label="Remove image"
								>
									<svg
										className="w-5 h-5 text-gray-600"
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
							)}
						</div>

						{/* File Info */}
						<div className="text-sm text-gray-600">
							<p>
								<span className="font-medium">File:</span> {selectedFile.name}
							</p>
							<p>
								<span className="font-medium">Size:</span>{" "}
								{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
							</p>
						</div>

						{/* Error Display */}
						{error && (
							<div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
								{error}
							</div>
						)}

						{/* Action Buttons */}
						{!analysisResult && (
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleAnalyze}
									disabled={isProcessing}
									className={`
										flex-1 px-4 py-2 rounded-md font-medium transition-colors
										${
											isProcessing
												? "bg-gray-300 text-gray-500 cursor-not-allowed"
												: "bg-blue-600 text-white hover:bg-blue-700"
										}
									`}
								>
									{isProcessing ? (
										<span className="flex items-center justify-center gap-2">
											<svg
												className="animate-spin h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Analyzing...
										</span>
									) : (
										"Analyze Image"
									)}
								</button>
								<button
									type="button"
									onClick={handleClear}
									disabled={isProcessing}
									className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Cancel
								</button>
							</div>
						)}

						{/* Analysis Results */}
						{analysisResult && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium">Generated Tasks</h3>
									<button
										type="button"
										onClick={handleClear}
										className="text-sm text-blue-600 hover:text-blue-700"
									>
										Analyze Another Image
									</button>
								</div>

								<div className="space-y-3">
									{analysisResult.tasks.map((task, index) => (
										<div
											key={`task-${index}-${task.title}`}
											className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-medium text-gray-900">
														{task.title}
													</h4>
													{task.description && (
														<p className="mt-1 text-sm text-gray-600">
															{task.description}
														</p>
													)}
												</div>
												<div className="ml-4 flex flex-col items-end gap-1">
													<span
														className={`
															px-2 py-1 text-xs font-medium rounded-full
															${
																task.priority === "high"
																	? "bg-red-100 text-red-700"
																	: task.priority === "medium"
																		? "bg-yellow-100 text-yellow-700"
																		: "bg-green-100 text-green-700"
															}
														`}
													>
														{task.priority}
													</span>
													<span className="text-xs text-gray-500">
														{Math.round(task.confidence_score * 100)}% confidence
													</span>
												</div>
											</div>
										</div>
									))}
								</div>

								<p className="text-sm text-gray-500 text-center">
									Processing time: {analysisResult.processing_time.toFixed(2)}s
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
