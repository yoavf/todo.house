import type { Task } from '../types/Task'

const TASK_TITLES = [
  'Clean the kitchen counter',
  'Vacuum the living room',
  'Water the plants',
  'Take out the trash',
  'Organize the closet',
  'Clean bathroom mirror',
  'Sweep the garage',
  'Wipe down appliances',
  'Do the laundry',
  'Change bed sheets',
  'Clean windows',
  'Mop the floors',
  'Dust shelves',
  'Clean refrigerator',
  'Organize pantry',
  'Vacuum under couch',
  'Clean oven',
  'Wash car',
  'Trim hedges',
  'Clean gutters',
]

const LOCATIONS = [
  'Kitchen',
  'Living Room',
  'Bedroom',
  'Bathroom',
  'Garage',
  'Garden',
  'Office',
  'Basement',
  'Attic',
  'Laundry Room',
]

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', // Kitchen
  'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop', // Living room
  'https://images.unsplash.com/photo-1521334884684-d80222895322?w=400&h=300&fit=crop', // Plants
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // Trash
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=300&fit=crop', // Closet
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop', // Bathroom
  'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop', // Laundry
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=400&h=300&fit=crop', // Clean space
]

interface TaskFactoryOptions {
  count?: number
  includeCompleted?: boolean
  includeSnoozed?: boolean
  includeImages?: boolean
  includeDueDates?: boolean
}

let taskCounter = 0

export function generateTask(overrides?: Partial<Task>): Task {
  const now = new Date()
  const taskIndex = taskCounter++

  const baseTask: Task = {
    id: `task-${Date.now()}-${taskIndex}`,
    title: TASK_TITLES[taskIndex % TASK_TITLES.length],
    location: LOCATIONS[taskIndex % LOCATIONS.length],
    createdAt: new Date(now.getTime() - taskIndex * 1000 * 60 * 60), // Each task 1 hour older
    completed: false,
    order: now.getTime() - taskIndex,
  }

  return { ...baseTask, ...overrides }
}

export function generateTasks(options: TaskFactoryOptions = {}): Task[] {
  const {
    count = 20,
    includeCompleted = true,
    includeSnoozed = true,
    includeImages = true,
    includeDueDates = true,
  } = options

  const tasks: Task[] = []
  taskCounter = 0
  const now = new Date()

  // Generate regular tasks
  for (let i = 0; i < count; i++) {
    const task = generateTask()

    // Add images to ~40% of tasks
    if (includeImages && Math.random() < 0.4) {
      task.imageUri = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]
    }

    // Add due dates to ~60% of tasks
    if (includeDueDates && Math.random() < 0.6) {
      const daysOffset = Math.floor(Math.random() * 14) - 7 // -7 to +7 days
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + daysOffset)
      dueDate.setHours(Math.floor(Math.random() * 24), 0, 0, 0)
      task.dueDate = dueDate
    }

    // Make ~20% completed
    if (includeCompleted && i < count * 0.2) {
      task.completed = true
    }

    // Snooze ~25% of tasks with various snooze options
    if (includeSnoozed && i >= count * 0.75) {
      const snoozeIndex = (i - Math.floor(count * 0.75)) % 4

      switch (snoozeIndex) {
        case 0: {
          // Tomorrow
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(9, 0, 0, 0)
          task.snoozeUntil = tomorrow
          break
        }

        case 1: {
          // This weekend
          const weekend = new Date(now)
          const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7
          weekend.setDate(weekend.getDate() + daysUntilSaturday)
          weekend.setHours(9, 0, 0, 0)
          task.snoozeUntil = weekend
          break
        }

        case 2: {
          // Next workday
          const nextMonday = new Date(now)
          const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7
          nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
          nextMonday.setHours(9, 0, 0, 0)
          task.snoozeUntil = nextMonday
          break
        }

        case 3: // Whenever
          task.isWheneverSnoozed = true
          task.snoozeUntil = undefined
          break
      }
    }

    tasks.push(task)
  }

  return tasks
}

export function resetTaskCounter() {
  taskCounter = 0
}

export const TaskFactory = {
  generateTask,
  generateTasks,
  reset: resetTaskCounter,
}
