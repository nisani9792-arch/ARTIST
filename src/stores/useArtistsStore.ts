import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { CrmArtist } from '../types'
import type { SignatureStatus } from '../data/types'
import type { HeaderStats } from '../api/artists'

type ArtistsState = {
  artistsById: Record<string, CrmArtist>
  stats: HeaderStats | null
  hydrate: (artists: CrmArtist[], stats?: HeaderStats) => void
  optimisticUpdate: (id: string, patch: Partial<CrmArtist>) => void
  rollback: (snapshots: Record<string, CrmArtist>) => void
}

export const useArtistsStore = create<ArtistsState>((set, get) => ({
  artistsById: {},
  stats: null,

  hydrate: (artists, stats) => {
    const artistsById: Record<string, CrmArtist> = {}
    for (const artist of artists) artistsById[artist.id] = artist
    set({ artistsById, stats: stats ?? get().stats })
  },

  optimisticUpdate: (id, patch) => {
    const current = get().artistsById[id]
    if (!current) return
    set({
      artistsById: {
        ...get().artistsById,
        [id]: { ...current, ...patch, updatedAt: new Date().toISOString() },
      },
    })
  },

  rollback: (snapshots) => {
    set({ artistsById: { ...get().artistsById, ...snapshots } })
  },
}))

export const useMainBoardArtists = () =>
  useArtistsStore(
    useShallow((s) =>
      Object.values(s.artistsById).filter((a) => a.status === 'in_process' || a.status === 'signed'),
    ),
  )

export const useVaultArtists = () =>
  useArtistsStore(
    useShallow((s) => Object.values(s.artistsById).filter((a) => a.status === 'unsigned')),
  )

export const useAllArtists = () =>
  useArtistsStore(useShallow((s) => Object.values(s.artistsById)))

export const adjustStatsForStatusChange = (
  stats: HeaderStats | null,
  from: SignatureStatus | undefined,
  to: SignatureStatus,
): HeaderStats | null => {
  if (!stats || !from || from === to) return stats
  const next = { ...stats }
  if (from === 'signed') next.signed = Math.max(0, next.signed - 1)
  if (from === 'unsigned') next.unsigned = Math.max(0, next.unsigned - 1)
  if (from === 'in_process') next.in_process = Math.max(0, next.in_process - 1)
  if (to === 'signed') next.signed += 1
  if (to === 'unsigned') next.unsigned += 1
  if (to === 'in_process') next.in_process += 1
  return next
}
