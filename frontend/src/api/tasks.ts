import { get, post, patch, destroy } from './client'
import type { Task, ApiErrors } from '../types'

export interface TaskData {
  name: string
  description?: string | null
  task_type: 'bug' | 'task'
  project_id?: string | null
  time_spent?: number | null
  estimated_time?: number | null
  deadline_date?: string | null
}

export const tasksApi = {
  index: (projectId?: string) => {
    const url = projectId ? `/tasks?project_id=${projectId}` : '/tasks'
    return get<{ tasks: Task[] }>(url).then(r => r.tasks)
  },
  show: (id: string) => get<{ task: Task }>(`/tasks/${id}`).then(r => r.task),
  create: (data: TaskData) =>
    post<{ errors: ApiErrors }>('/tasks', { task: data }),
  update: (id: string, data: TaskData) =>
    patch<{ errors: ApiErrors }>(`/tasks/${id}`, { task: data }),
  destroy: (id: string) => destroy(`/tasks/${id}`),
}
