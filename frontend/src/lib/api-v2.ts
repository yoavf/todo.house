/**
 * API v2 - Uses proper authentication via NextAuth
 * This will replace the current api.ts once auth is fully integrated
 */

import type {
	ImageAnalysisResponse,
	ImageMetadata,
	Task,
	TaskCreate,
	TaskUpdate,
} from "./api";
import { authenticatedFetch } from "./api-client";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
	body?: any;
}

/**
 * Helper for JSON API requests
 */
async function apiRequest<T>(
	url: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const { body, ...fetchOptions } = options;

	const requestOptions: RequestInit = {
		...fetchOptions,
		headers: {
			"Content-Type": "application/json",
			...(fetchOptions.headers as Record<string, string>),
		},
	};

	if (body) {
		requestOptions.body = JSON.stringify(body);
	}

	const response = await authenticatedFetch(url, requestOptions);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || `Request failed: ${response.statusText}`);
	}

	return response.json();
}

export const tasksAPI = {
	async getTasks(): Promise<Task[]> {
		return apiRequest<Task[]>("/api/tasks/");
	},

	async createTask(task: TaskCreate): Promise<Task> {
		return apiRequest<Task>("/api/tasks/", {
			method: "POST",
			body: task,
		});
	},

	async updateTask(id: number, update: TaskUpdate): Promise<Task> {
		return apiRequest<Task>(`/api/tasks/${id}`, {
			method: "PUT",
			body: update,
		});
	},

	async deleteTask(id: number): Promise<void> {
		await authenticatedFetch(`/api/tasks/${id}`, {
			method: "DELETE",
		});
	},

	async getTask(id: number): Promise<Task> {
		return apiRequest<Task>(`/api/tasks/${id}`);
	},

	async snoozeTask(id: number, snoozeOption: string): Promise<Task> {
		return apiRequest<Task>(`/api/tasks/${id}/snooze`, {
			method: "POST",
			body: { snooze_option: snoozeOption },
		});
	},

	async unsnoozeTask(id: number): Promise<Task> {
		return apiRequest<Task>(`/api/tasks/${id}/unsnooze`, {
			method: "POST",
		});
	},

	async analyzeImage(imageFile: File): Promise<ImageAnalysisResponse> {
		const formData = new FormData();
		formData.append("image", imageFile);
		formData.append("generate_tasks", "true");

		const response = await authenticatedFetch("/api/images/analyze", {
			method: "POST",
			body: formData,
			headers: {
				// Don't set Content-Type, let browser set it with boundary for multipart
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Failed to analyze image");
		}

		return response.json();
	},

	async getImage(imageId: string): Promise<ImageMetadata> {
		return apiRequest<ImageMetadata>(`/api/images/${imageId}`);
	},
};

export const userAPI = {
	async getSettings() {
		return apiRequest("/api/user-settings/me");
	},

	async updateSettings(settings: any) {
		return apiRequest("/api/user-settings/me", {
			method: "PATCH",
			body: settings,
		});
	},
};
