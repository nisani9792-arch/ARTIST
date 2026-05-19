import { request } from './client'

export type AccessState = {
  gateUnlocked: boolean
  displayName: string | null
}

export type UnlockMethod = 'password' | 'shortcut' | 'biometric'

export const fetchAccessState = async () => {
  const response = await request<{ access: AccessState }>('/api/access/me')
  return response.access
}

export const unlockGate = async (options?: { method?: UnlockMethod; secret?: string }) => {
  const response = await request<{ access: AccessState }>('/api/access/unlock', {
    method: 'POST',
    body: JSON.stringify({
      method: options?.method ?? 'password',
      secret: options?.secret,
    }),
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
