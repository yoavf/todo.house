export interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface TaskCreate {
  title: string
  description?: string
}

export interface TaskUpdate {
  title?: string
  description?: string
  completed?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const tasksAPI = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/todos/`, {
      headers: {
        'X-User-Id': 'test-user'
      }
    })
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await fetch(`${API_URL}/todos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'test-user'
      },
      body: JSON.stringify(task)
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  async updateTask(id: number, update: TaskUpdate): Promise<Task> {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'test-user'
      },
      body: JSON.stringify(update)
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': 'test-user'
      }
    })
    if (!response.ok) throw new Error('Failed to delete task')
  }
}