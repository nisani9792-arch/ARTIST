import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type Toast } from './ToastContext'

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, tone: Toast['tone'] = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
    }),
    [toasts, pushToast, dismissToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export const ToastStack = () => {
  const context = useContext(ToastContext)
  if (!context) return null

  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence initial={false}>
        {context.toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.tone}`}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => context.dismissToast(toast.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
