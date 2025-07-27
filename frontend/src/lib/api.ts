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
}

export interface TaskCreate {
	title: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	source?: "manual" | "ai_generated";
	source_image_id?: string;
	ai_confidence?: number;
	ai_provider?: string;
}

export interface TaskUpdate {
	title?: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	completed?: boolean;
	status?: "active" | "snoozed" | "completed";
	snoozed_until?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const tasksAPI = {
	async getTasks(): Promise<Task[]> {
		const response = await fetch(`${API_URL}/api/tasks/`, {
			headers: {
				"X-User-Id": "test-user",
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
				"X-User-Id": "test-user",
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
				"X-User-Id": "test-user",
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
				"X-User-Id": "test-user",
			},
		});
		if (!response.ok) throw new Error("Failed to delete task");
	},
};

export interface GeneratedTask {
	title: string;
	description: string;
	priority: "low" | "medium" | "high";
	category: string;
	confidence_score: number;
}

export interface ImageAnalysisResult {
	image_id?: string;
	tasks: GeneratedTask[];
	analysis_summary: string;
	processing_time: number;
	provider_used: string;
	image_metadata: Record<string, any>;
	retry_count: number;
}

export const imageAPI = {
	async analyzeImage(file: File): Promise<ImageAnalysisResult> {
		const formData = new FormData();
		formData.append("image", file);
		formData.append("generate_tasks", "true");

		const response = await fetch(`${API_URL}/api/images/analyze`, {
			method: "POST",
			headers: {
				"X-User-Id": "test-user",
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail || "Failed to analyze image");
		}

		return response.json();
	},
};
