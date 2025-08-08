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
