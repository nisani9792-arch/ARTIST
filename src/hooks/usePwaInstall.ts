import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_DISMISS_KEY = 'artist-pwa-install-dismissed'

export const usePwaInstall = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(INSTALL_DISMISS_KEY) === '1',
  )

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    setIsIos(ios)

    const onInstallable = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onInstallable)
    return () => window.removeEventListener('beforeinstallprompt', onInstallable)
  }, [])

  const canInstall = !isStandalone && !dismissed && (Boolean(installEvent) || isIos)

  const install = useCallback(async () => {
    if (installEvent) {
      await installEvent.prompt()
      await installEvent.userChoice
      setInstallEvent(null)
      return
    }
  }, [installEvent])

  const dismiss = useCallback(() => {
    localStorage.setItem(INSTALL_DISMISS_KEY, '1')
    setDismissed(true)
  }, [])

  return { canInstall, install, dismiss, isIos, isStandalone, installEvent }
}
