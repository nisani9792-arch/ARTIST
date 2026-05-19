export const parseError = async (response: Response) => {
  const text = await response.text()
  try {
    const json = JSON.parse(text) as { error?: string }
    if (json.error) return json.error
  } catch {
    // ignore
  }
  return text || `Request failed with status ${response.status}`
}

export const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
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
