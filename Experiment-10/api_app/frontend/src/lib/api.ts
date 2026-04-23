import { clearToken, getToken } from './storage'

export type ApiError = {
  message: string
  status: number
}

function toApiError(res: Response, message: string): ApiError {
  return { message, status: res.status }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Accept', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options?.body
  if (options && 'json' in options) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json ?? {})
  }

  const res = await fetch(path, { ...options, headers, body })

  if (res.status === 401) {
    clearToken()
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw toApiError(res, text || res.statusText || 'Request failed')
  }

  // 204/empty body
  const text = await res.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}

