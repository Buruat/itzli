export interface Project {
  id: string
  name: string
  description: string | null
  image_url: string | null
}

export interface Task {
  id: string
  name: string
  description: string | null
  task_type: 'bug' | 'task'
  project_id: string | null
  time_spent: number | null
  estimated_time: number | null
  deadline_date: string | null
}

export type ApiErrors = Record<string, string[]>

export interface User {
  id: string
  username: string
  phone: string
  photo_url: string | null
}
