import type { TaskAnalysisResult } from "../types/TaskAnalysisResult";
import { logger } from './logger';

export async function analyzeImageForTask(
	base64Image: string,
): Promise<TaskAnalysisResult> {
	logger.info('APIClient', '🔍 Client: Starting API image analysis...');
	logger.debug('APIClient', '📊 Client: Image data length:', base64Image.length);

	if (!base64Image || base64Image.length === 0) {
		logger.error('APIClient', '❌ Client: Empty or invalid base64 image');
		return {
			success: false,
			error: "Invalid image data provided.",
		};
	}

	try {
		logger.debug('APIClient', '📝 Client: Preparing API request...');

		const response = await fetch("/api/analyze-image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				base64Image,
			}),
		});

		logger.debug('APIClient', '📡 Client: API response status:', response.status);

		if (!response.ok) {
			const errorData = await response.json();
			logger.error('APIClient', '❌ Client: API error response:', errorData);

			return {
				success: false,
				error: errorData.error || `Server error: ${response.status}`,
			};
		}

		const result = await response.json();
		logger.info('APIClient', '✅ Client: API response received:', result);

		return result;
	} catch (error) {
		logger.error('APIClient', '❌ Client: API request error:', error);

		if (error instanceof Error) {
			logger.error('APIClient', 'Client Error name:', error.name);
			logger.error('APIClient', 'Client Error message:', error.message);

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
