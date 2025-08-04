"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	title?: string;
}

export function ImageLightbox({
	isOpen,
	onClose,
	imageUrl,
	title,
}: ImageLightboxProps) {
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "";
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="dialog"
			aria-modal="true"
			aria-label={title || "Image viewer"}
			tabIndex={-1}
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
			>
				<XIcon size={24} />
			</button>
			<button
				type="button"
				className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center bg-transparent border-none p-0"
				onClick={(e) => e.stopPropagation()}
				aria-label="Image content"
			>
				<Image
					src={imageUrl}
					alt={title || "Task image"}
					width={1200}
					height={800}
					className="max-w-full max-h-[90vh] object-contain"
					style={{ width: "auto", height: "auto" }}
				/>
				{title && (
					<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
						<p className="text-white text-lg font-medium">{title}</p>
					</div>
				)}
			</button>
		</div>,
		document.body,
	);
}
