import * as client from './client'
import type { User } from '../types'

interface AuthResponse {
  token: string
  user: User
}

interface AuthErrors {
  errors: Record<string, string[]>
}

export const authApi = {
  register: (data: FormData) =>
    client.postFormData<AuthResponse | AuthErrors>('/auth/register', data),

  login: (phone: string, password: string) =>
    client.post<AuthResponse | AuthErrors>('/auth/login', { phone, password }),

  logout: () => client.destroy('/auth/logout'),

  me: () => client.get<{ user: User }>('/auth/me'),
}
