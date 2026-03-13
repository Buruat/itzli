import { get, postFormData, patchFormData, destroy } from './client'
import type { Project, ApiErrors } from '../types'

export interface ProjectFormData {
  name: string
  description?: string
  image?: File | null
}

function toFormData(data: ProjectFormData): FormData {
  const fd = new FormData()
  fd.append('project[name]', data.name)
  if (data.description != null) fd.append('project[description]', data.description)
  if (data.image) fd.append('project[image]', data.image)
  return fd
}

export const projectsApi = {
  index: () => get<{ projects: Project[] }>('/projects').then(r => r.projects),
  show: (id: string) => get<{ project: Project }>(`/projects/${id}`).then(r => r.project),
  create: (data: ProjectFormData) =>
    postFormData<{ errors: ApiErrors }>('/projects', toFormData(data)),
  update: (id: string, data: ProjectFormData) =>
    patchFormData<{ errors: ApiErrors }>(`/projects/${id}`, toFormData(data)),
  destroy: (id: string) => destroy(`/projects/${id}`),
}
