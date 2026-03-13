import { get, post, patch, destroy } from './client'
import type { Project, ApiErrors } from '../types'

export const projectsApi = {
  index: () => get<{ projects: Project[] }>('/projects').then(r => r.projects),
  show: (id: string) => get<{ project: Project }>(`/projects/${id}`).then(r => r.project),
  create: (data: { name: string }) =>
    post<{ errors: ApiErrors }>('/projects', { project: data }),
  update: (id: string, data: { name: string }) =>
    patch<{ errors: ApiErrors }>(`/projects/${id}`, { project: data }),
  destroy: (id: string) => destroy(`/projects/${id}`),
}
