"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useState } from "react";

interface ImageUploadProps {
	onImageSelect: (file: File) => void;
	isProcessing?: boolean;
	maxSizeMB?: number;
}

export function ImageUpload({
	onImageSelect,
	isProcessing = false,
	maxSizeMB = 10,
}: ImageUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const validateFile = useCallback(
		(file: File): string | null => {
			const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
			if (!validTypes.includes(file.type)) {
				return "Please upload a JPEG, PNG, or WebP image";
			}

			const maxSizeBytes = maxSizeMB * 1024 * 1024;
			if (file.size > maxSizeBytes) {
				return `Image must be less than ${maxSizeMB}MB`;
			}

			return null;
		},
		[maxSizeMB],
	);

	const handleFile = useCallback(
		(file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				return;
			}

			setError(null);
			onImageSelect(file);
		},
		[onImageSelect, validateFile],
	);

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	return (
		<div className="w-full">
			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
					{error}
				</div>
			)}

			{/* biome-ignore lint/a11y/useSemanticElements: Div with drag-drop needs role for accessibility */}
			<div
				role="button"
				tabIndex={0}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`
					relative border-2 border-dashed rounded-lg p-8 text-center transition-all
					${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}
					${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}
				`}
			>
				<input
					type="file"
					onChange={handleFileInput}
					accept="image/jpeg,image/jpg,image/png,image/webp"
					disabled={isProcessing}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					aria-label="Upload image"
				/>

				<div className="space-y-4">
					<div className="flex justify-center">
						<svg
							className="w-12 h-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
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
						<p className="text-gray-700 font-medium">
							{isDragging
								? "Drop your image here"
								: "Drop an image or click to upload"}
						</p>
						<p className="text-sm text-gray-500 mt-1">
							JPEG, PNG, or WebP up to {maxSizeMB}MB
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
