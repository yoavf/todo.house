export interface Task {
  id: string;
  title: string;
  location?: string;
  createdAt: Date;
  completed: boolean;
  // Enhanced task list fields
  dueDate?: Date;
  snoozeUntil?: Date;
  order: number; // For custom ordering
  imageUri?: string; // For tasks created from camera
}

export type SnoozeDuration = '1hour' | '3hours' | 'tomorrow' | 'nextweek';