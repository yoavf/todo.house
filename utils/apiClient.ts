import type { TaskAnalysisResult } from "../types/TaskAnalysisResult";
import { logger } from './logger';

interface TranscriptionResult {
	tasks: Array<{
		title: string;
		location?: string;
		dueDate?: string;
	}>;
}

export const apiClient = {
	analyzeImage: analyzeImageForTask,
	transcribeAudio,
};

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

export async function transcribeAudio(
	data: { audioBase64: string; audioType?: string },
): Promise<TranscriptionResult> {
	logger.info('APIClient', '🎤 Client: Starting audio transcription...');

	try {
		logger.debug('APIClient', '📝 Client: Preparing transcription request...');

		const response = await fetch("/api/transcribe-audio", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		logger.debug('APIClient', '📡 Client: Transcription response status:', response.status);

		if (!response.ok) {
			const errorData = await response.json();
			logger.error('APIClient', '❌ Client: Transcription error response:', errorData);
			throw new Error(errorData.error || `Server error: ${response.status}`);
		}

		const result = await response.json();
		logger.info('APIClient', '✅ Client: Transcription response received:', result);

		return result;
	} catch (error) {
		logger.error('APIClient', '❌ Client: Transcription request error:', error);
		throw error;
	}
}
