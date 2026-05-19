import { createContext } from 'react'
import type { ToastTone } from './toastTypes'

export type Toast = {
  id: number
  message: string
  tone: ToastTone
}

export type ToastContextValue = {
  toasts: Toast[]
  pushToast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
