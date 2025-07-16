import type { TaskAnalysisResult } from "../types/TaskAnalysisResult";

export async function analyzeImageForTask(
	base64Image: string,
): Promise<TaskAnalysisResult> {
	console.log("🔍 Client: Starting API image analysis...");
	console.log("📊 Client: Image data length:", base64Image.length);

	if (!base64Image || base64Image.length === 0) {
		console.error("❌ Client: Empty or invalid base64 image");
		return {
			success: false,
			error: "Invalid image data provided.",
		};
	}

	try {
		console.log("📝 Client: Preparing API request...");

		const response = await fetch("/api/analyze-image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				base64Image,
			}),
		});

		console.log("📡 Client: API response status:", response.status);

		if (!response.ok) {
			const errorData = await response.json();
			console.error("❌ Client: API error response:", errorData);

			return {
				success: false,
				error: errorData.error || `Server error: ${response.status}`,
			};
		}

		const result = await response.json();
		console.log("✅ Client: API response received:", result);

		return result;
	} catch (error) {
		console.error("❌ Client: API request error:", error);

		if (error instanceof Error) {
			console.error("Client Error name:", error.name);
			console.error("Client Error message:", error.message);

			// Check for specific error types
			if (
				error.message.includes("fetch") ||
				error.message.includes("network")
			) {
				return {
					success: false,
					error:
						"Network error. Please check your internet connection and try again.",
				};
			}

			if (error.message.includes("timeout")) {
				return {
					success: false,
					error: "Request timeout. Please try again.",
				};
			}
		}

		return {
			success: false,
			error: "Failed to analyze image. Please try again.",
		};
	}
}
