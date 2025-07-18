export const ScheduleFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export type ScheduleFrequency =
  (typeof ScheduleFrequency)[keyof typeof ScheduleFrequency]

export interface Schedule {
  frequency: ScheduleFrequency
  interval: number // e.g., every 2 weeks, every 3 months
  endDate?: Date // Optional end date for the schedule
  occurrences?: number // Optional number of occurrences
  originalTaskId?: string // Reference to the original task (for generated tasks)
}

export interface Task {
  id: string
  title: string
  location?: string
  createdAt: Date
  completed: boolean
  // Enhanced task list fields
  dueDate?: Date
  snoozeUntil?: Date
  isWheneverSnoozed?: boolean // For "whenever" snooze without specific date
  order: number // For custom ordering
  imageUri?: string // For tasks created from camera
  // Schedule fields
  schedule?: Schedule // For recurring tasks
  isScheduled?: boolean // Flag to identify scheduled tasks
  isFutureTask?: boolean // Flag to identify future tasks generated from schedules
  seriesId?: string // Identifier for tasks that belong to the same recurring series
}

export const SnoozeDuration = {
  TOMORROW: 'tomorrow',
  THIS_WEEKEND: 'this-weekend',
  NEXT_WORKDAY: 'next-workday',
  WHENEVER: 'whenever',
} as const

export type SnoozeDuration =
  (typeof SnoozeDuration)[keyof typeof SnoozeDuration]
