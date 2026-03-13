const BASE_URL = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const token = getToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const get = <T>(path: string) => request<T>(path)

export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const postFormData = <T>(path: string, body: FormData) =>
  request<T>(path, { method: 'POST', body })

export const patchFormData = <T>(path: string, body: FormData) =>
  request<T>(path, { method: 'PATCH', body })

export const destroy = (path: string) =>
  request<void>(path, { method: 'DELETE' })
