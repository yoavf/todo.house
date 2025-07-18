import type { Task } from '../types/Task'

export function generateDemoTasks(): Omit<
  Task,
  'id' | 'createdAt' | 'order'
>[] {
  return [
    {
      title: 'Clean Kitchen Countertops',
      location: 'Kitchen',
      completed: false,
      estimatedTime: '15-20 min',
      effort: 'Easy',
      description:
        'Wipe down all surfaces, organize items, and sanitize the countertops.',
    },
    {
      title: 'Organize Bedroom Closet',
      location: 'Bedroom',
      completed: false,
      estimatedTime: '45-60 min',
      effort: 'Medium',
      description:
        'Sort through clothes, organize by category, and donate items you no longer wear.',
    },
    {
      title: 'Vacuum Living Room',
      location: 'Living Room',
      completed: false,
      estimatedTime: '20-30 min',
      effort: 'Easy',
      description:
        'Vacuum all carpeted areas, under furniture, and clean the baseboards.',
    },
    {
      title: 'Deep Clean Bathroom',
      location: 'Bathroom',
      completed: false,
      estimatedTime: '60-90 min',
      effort: 'Hard',
      description:
        'Scrub tiles, clean grout, disinfect all surfaces, and organize toiletries.',
    },
    {
      title: 'Organize Office Desk',
      location: 'Office',
      completed: false,
      estimatedTime: '20-30 min',
      effort: 'Medium',
      description:
        'File paperwork, organize supplies, and create a productive workspace.',
    },
    {
      title: 'Water Plants',
      location: 'General',
      completed: false,
      estimatedTime: '10-15 min',
      effort: 'Easy',
      description: 'Check soil moisture and water all indoor plants as needed.',
    },
  ]
}
