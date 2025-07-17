export interface Task {
  id: string;
  title: string;
  location?: string;
  createdAt: Date;
  completed: boolean;
  // Enhanced task list fields
  dueDate?: Date;
  snoozeUntil?: Date;
  isWheneverSnoozed?: boolean; // For "whenever" snooze without specific date
  order: number; // For custom ordering
  imageUri?: string; // For tasks created from camera
}

export const SnoozeDuration = {
  TOMORROW: 'tomorrow',
  THIS_WEEKEND: 'this-weekend',
  NEXT_WORKDAY: 'next-workday',
  WHENEVER: 'whenever'
} as const;

export type SnoozeDuration = typeof SnoozeDuration[keyof typeof SnoozeDuration];