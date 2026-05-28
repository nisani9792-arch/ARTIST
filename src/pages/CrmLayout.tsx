import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageTransition } from '../components/motion/PageTransition'
import { AppShell } from '../components/AppShell'
import { ArtistAiChat } from '../components/ArtistAiChat'
import { useArtistStats } from '../features/artists/useArtistsQuery'
import type { HeaderStats } from '../api/artists'
import type { ViewMode } from '../types'

export type ArtistsUiState = {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  openCreateModal: () => void
}

export type CrmOutletContext = {
  operatorName: string
  setArtistsUi: (state: ArtistsUiState) => void
  setSaveStatus: (status: 'idle' | 'loading' | 'saving' | 'error') => void
  setStats: (stats?: HeaderStats) => void
  setBackupHandler: (handler: () => Promise<void>) => void
  setExportHandler: (handler: () => void | Promise<void>) => void
}

type CrmLayoutProps = {
  operatorName: string
}

export const CrmLayout = ({ operatorName }: CrmLayoutProps) => {
  const location = useLocation()
  const { data: statsData, refetch } = useArtistStats()
  const [artistsUi, setArtistsUiState] = useState<ArtistsUiState | null>(null)
  const [pageStats, setPageStats] = useState<HeaderStats | undefined>()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle')
  const [backupHandler, setBackupHandlerState] = useState<(() => Promise<void>) | null>(null)
  const [exportHandler, setExportHandlerState] = useState<(() => void | Promise<void>) | null>(
    null,
  )

  const setArtistsUi = useCallback((state: ArtistsUiState) => {
    setArtistsUiState(state)
  }, [])

  const setBackupHandler = useCallback((handler: () => Promise<void>) => {
    setBackupHandlerState(() => handler)
  }, [])

  const setExportHandler = useCallback((handler: () => void | Promise<void>) => {
    setExportHandlerState(() => handler)
  }, [])

  const outletContext = useMemo<CrmOutletContext>(
    () => ({
      operatorName,
      setArtistsUi,
      setSaveStatus,
      setStats: setPageStats,
      setBackupHandler,
      setExportHandler,
    }),
    [operatorName, setArtistsUi, setBackupHandler, setExportHandler],
  )

  const stats = location.pathname.startsWith('/artists') ? (pageStats ?? statsData) : statsData

  useEffect(() => {
    if (!location.pathname.startsWith('/artists')) {
      setPageStats(undefined)
    }
  }, [location.pathname])

  const workspaceMode = location.pathname.startsWith('/artists')

  return (
    <AppShell
      operatorName={operatorName}
      stats={stats}
      saveStatus={saveStatus}
      workspaceMode={workspaceMode}
      viewMode={artistsUi?.viewMode}
      searchOpen={artistsUi?.searchOpen}
      onRefresh={() => void refetch()}
      onExport={exportHandler ? () => void exportHandler() : undefined}
      onBackup={backupHandler ? () => void backupHandler() : undefined}
      onNewArtist={artistsUi?.openCreateModal}
      onSetView={artistsUi?.setViewMode}
      onToggleSearch={() => artistsUi?.setSearchOpen(!(artistsUi?.searchOpen ?? false))}
    >
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet context={outletContext} />
        </PageTransition>
      </AnimatePresence>

      <ArtistAiChat operatorName={operatorName} />
    </AppShell>
  )
}
