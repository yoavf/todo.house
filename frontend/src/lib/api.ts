/**
 * API client - Uses proper authentication via NextAuth
 */

import { authenticatedFetch } from "./api-client";

// Type definitions
export type TaskType =
	| "interior"
	| "exterior"
	| "electricity"
	| "plumbing"
	| "appliances"
	| "maintenance"
	| "repair";

export interface Location {
	id: string;
	name: string;
	description?: string;
}

export interface HowToContent {
	type: "how_to_guide";
	markdown: string;
	images?: Array<{ url: string; caption?: string }>;
	videos?: Array<{ url: string; title: string }>;
	links?: Array<{ url: string; text: string }>;
}

export interface ChecklistItem {
	id: string;
	text: string;
	completed: boolean;
}

export interface ChecklistContent {
	type: "checklist";
	items: ChecklistItem[];
}

export interface ShoppingListItem {
	name: string;
	quantity?: string;
	purchased: boolean;
}

export interface ShoppingListContent {
	type: "shopping_list";
	items: ShoppingListItem[];
	store?: string;
	estimated_cost?: number;
}

export type TaskContent = HowToContent | ChecklistContent | ShoppingListContent;

export interface Task {
	id: number;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	completed: boolean;
	status: "active" | "snoozed" | "completed";
	snoozed_until?: string;
	source: "manual" | "ai_generated";
	source_image_id?: string;
	ai_confidence?: number;
	ai_provider?: string;
	created_at: string;
	updated_at: string;
	user_id: string;
	task_types?: TaskType[];
	// Image URLs - populated by backend
	image_url?: string;
	thumbnail_url?: string;
	// Enhanced fields
	location?: Location;
	content?: TaskContent;
	metrics?: Record<string, unknown>;
	tags?: string[];
	snooze_options?: Record<string, unknown>;
}

export interface TaskCreate {
	title: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	completed?: boolean;
	status?: "active" | "snoozed" | "completed";
	snoozed_until?: string;
	source?: "manual" | "ai_generated";
	source_image_id?: string;
	ai_confidence?: number;
	ai_provider?: string;
	task_types?: TaskType[];
}

export interface TaskUpdate {
	title?: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	completed?: boolean;
	status?: "active" | "snoozed" | "completed";
	snoozed_until?: string;
	task_types?: TaskType[];
}

export interface GeneratedTask {
	title: string;
	description: string;
	priority: "low" | "medium" | "high";
	category: string;
	confidence_score: number;
	task_types?: TaskType[];
}

export interface ImageAnalysisResponse {
	image_id: string | null;
	tasks: GeneratedTask[];
	analysis_summary: string;
	processing_time: number;
	provider_used: string;
	image_metadata: Record<string, unknown>;
	retry_count: number;
}

export interface ImageMetadata {
	id: string;
	url: string;
	thumbnail_url: string;
	filename: string;
	content_type: string;
	file_size: number;
	created_at: string;
	analysis_status: string;
}

export interface UserSettings {
	notifications?: {
		enabled?: boolean;
		email?: boolean;
		push?: boolean;
	};
	theme?: "light" | "dark" | "system";
	language?: string;
	timezone?: string;
}

interface ApiRequestOptions<T = unknown> extends Omit<RequestInit, "body"> {
	body?: T;
}

/**
 * Normalize headers to a plain object with string values
 * Handles Headers instances, arrays of tuples, and plain objects
 */
function normalizeHeaders(
	headers: HeadersInit | undefined,
): Record<string, string> {
	if (!headers) {
		return {};
	}

	// Handle Headers instance
	if (headers instanceof Headers) {
		const result: Record<string, string> = {};
		headers.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	// Handle array of tuples [key, value][]
	if (Array.isArray(headers)) {
		const result: Record<string, string> = {};
		headers.forEach(([key, value]) => {
			if (typeof key === "string" && typeof value === "string") {
				result[key] = value;
			}
		});
		return result;
	}

	// Handle plain object
	if (typeof headers === "object") {
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(headers)) {
			if (typeof value === "string") {
				result[key] = value;
			}
		}
		return result;
	}

	return {};
}

/**
 * Helper for JSON API requests
 */
async function apiRequest<TResponse, TBody = unknown>(
	url: string,
	options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
	const { body, ...fetchOptions } = options;

	// Normalize headers to ensure all HeadersInit types are handled correctly
	const additionalHeaders = normalizeHeaders(fetchOptions.headers);

	const requestOptions: RequestInit = {
		...fetchOptions,
		headers: additionalHeaders,
	};

	// Handle different body types
	if (body) {
		if (body instanceof FormData) {
			// For FormData, don't set Content-Type (browser will set it with boundary)
			requestOptions.body = body as any;
		} else {
			// For JSON data
			requestOptions.headers = {
				"Content-Type": "application/json",
				...additionalHeaders,
			};
			requestOptions.body = JSON.stringify(body);
		}
	} else if (
		!body &&
		fetchOptions.method !== "GET" &&
		fetchOptions.method !== "DELETE"
	) {
		// Ensure Content-Type is set for requests that might have empty bodies
		requestOptions.headers = {
			"Content-Type": "application/json",
			...additionalHeaders,
		};
	}

	const response = await authenticatedFetch(url, requestOptions);

	if (!response.ok) {
		// Handle error response based on content type
		const contentType = response.headers.get("content-type");
		let errorMessage: string;

		if (contentType?.includes("application/json")) {
			try {
				const errorData = await response.json();
				// FastAPI typically returns errors as { detail: "error message" }
				errorMessage =
					errorData.detail || errorData.message || JSON.stringify(errorData);
			} catch {
				errorMessage = `Request failed: ${response.statusText}`;
			}
		} else {
			// Handle text or HTML error responses
			errorMessage = await response
				.text()
				.catch(() => `Request failed: ${response.statusText}`);
		}

		throw new Error(errorMessage || `Request failed: ${response.statusText}`);
	}

	// Check if response has no content (204, 205, or Content-Length: 0)
	// These responses should not be parsed as JSON
	const contentLength = response.headers.get("content-length");
	const hasNoContent =
		response.status === 204 || response.status === 205 || contentLength === "0";

	if (hasNoContent) {
		// Return null for no-content responses
		// TypeScript will need to handle this in the TResponse type
		return null as TResponse;
	}

	return response.json();
}

export const tasksAPI = {
	async getTasks(): Promise<Task[]> {
		return apiRequest<Task[], never>("/api/tasks/");
	},

	async createTask(task: TaskCreate): Promise<Task> {
		return apiRequest<Task, TaskCreate>("/api/tasks/", {
			method: "POST",
			body: task,
		});
	},

	async updateTask(id: number, update: TaskUpdate): Promise<Task> {
		return apiRequest<Task, TaskUpdate>(`/api/tasks/${id}`, {
			method: "PUT",
			body: update,
		});
	},

	async deleteTask(id: number): Promise<void> {
		// DELETE requests typically return 204 No Content
		// apiRequest will handle this and return null
		await apiRequest<null, never>(`/api/tasks/${id}`, {
			method: "DELETE",
		});
	},

	async getTask(id: number): Promise<Task> {
		return apiRequest<Task, never>(`/api/tasks/${id}`);
	},

	async snoozeTask(id: number, snoozeOption: string): Promise<Task> {
		return apiRequest<Task, { snooze_option: string }>(
			`/api/tasks/${id}/snooze`,
			{
				method: "POST",
				body: { snooze_option: snoozeOption },
			},
		);
	},

	async unsnoozeTask(id: number): Promise<Task> {
		return apiRequest<Task, never>(`/api/tasks/${id}/unsnooze`, {
			method: "POST",
		});
	},

	async analyzeImage(imageFile: File): Promise<ImageAnalysisResponse> {
		const formData = new FormData();
		formData.append("image", imageFile);
		formData.append("generate_tasks", "true");

		// apiRequest now handles FormData properly
		return apiRequest<ImageAnalysisResponse, FormData>("/api/images/analyze", {
			method: "POST",
			body: formData,
		});
	},

	async getImage(imageId: string): Promise<ImageMetadata> {
		return apiRequest<ImageMetadata, never>(`/api/images/${imageId}`);
	},
};

export const userAPI = {
	async getSettings(): Promise<UserSettings> {
		return apiRequest<UserSettings, never>("/api/user-settings/me");
	},

	async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
		return apiRequest<UserSettings, Partial<UserSettings>>(
			"/api/user-settings/me",
			{
				method: "PATCH",
				body: settings,
			},
		);
	},
};
