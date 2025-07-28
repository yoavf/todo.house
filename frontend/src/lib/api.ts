export interface Task {
	id: number;
	title: string;
	description?: string;
	priority: 'low' | 'medium' | 'high';
	completed: boolean;
	status: 'active' | 'snoozed' | 'completed';
	snoozed_until?: string;
	source: 'manual' | 'ai_generated';
	source_image_id?: string;
	ai_confidence?: number;
	ai_provider?: string;
	created_at: string;
	updated_at: string;
	user_id: string;
}

export interface TaskCreate {
	title: string;
	description?: string;
	priority?: 'low' | 'medium' | 'high';
	completed?: boolean;
	status?: 'active' | 'snoozed' | 'completed';
	snoozed_until?: string;
	source?: 'manual' | 'ai_generated';
	source_image_id?: string;
	ai_confidence?: number;
	ai_provider?: string;
}

export interface TaskUpdate {
	title?: string;
	description?: string;
	priority?: 'low' | 'medium' | 'high';
	completed?: boolean;
	status?: 'active' | 'snoozed' | 'completed';
	snoozed_until?: string;
}

export interface GeneratedTask {
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	category: string;
	confidence_score: number;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export const tasksAPI = {
	async getTasks(): Promise<Task[]> {
		const response = await fetch(`${API_URL}/api/tasks/`, {
			headers: {
				"X-User-Id": TEST_USER_ID,
			},
		});
		if (!response.ok) throw new Error("Failed to fetch tasks");
		return response.json();
	},

	async createTask(task: TaskCreate): Promise<Task> {
		const response = await fetch(`${API_URL}/api/tasks/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-User-Id": TEST_USER_ID,
			},
			body: JSON.stringify(task),
		});
		if (!response.ok) throw new Error("Failed to create task");
		return response.json();
	},

	async updateTask(id: number, update: TaskUpdate): Promise<Task> {
		const response = await fetch(`${API_URL}/api/tasks/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"X-User-Id": TEST_USER_ID,
			},
			body: JSON.stringify(update),
		});
		if (!response.ok) throw new Error("Failed to update task");
		return response.json();
	},

	async deleteTask(id: number): Promise<void> {
		const response = await fetch(`${API_URL}/api/tasks/${id}`, {
			method: "DELETE",
			headers: {
				"X-User-Id": TEST_USER_ID,
			},
		});
		if (!response.ok) throw new Error("Failed to delete task");
	},

	async analyzeImage(imageFile: File): Promise<ImageAnalysisResponse> {
		const formData = new FormData();
		formData.append('image', imageFile);
		formData.append('generate_tasks', 'true');

		const response = await fetch(`${API_URL}/api/images/analyze`, {
			method: "POST",
			headers: {
				"X-User-Id": TEST_USER_ID,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Failed to analyze image");
		}

		return response.json();
	},
};
