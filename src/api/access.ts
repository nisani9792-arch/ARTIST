export type AccessState = {
  gateUnlocked: boolean
  displayName: string | null
}

const parseError = async (response: Response) => {
  const text = await response.text()
  try {
    const json = JSON.parse(text) as { error?: string }
    if (json.error) return json.error
  } catch {
    // ignore
  }
  return text || `Request failed with status ${response.status}`
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json() as Promise<T>
}

export const fetchAccessState = async () => {
  const response = await request<{ access: AccessState }>('/api/access/me')
  return response.access
}

export const unlockGate = async () => {
  const response = await request<{ access: AccessState }>('/api/access/unlock', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return response.access
}

export const registerOperator = async (displayName: string) => {
  const response = await request<{ access: AccessState }>('/api/access/register', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
  return response.access
}
