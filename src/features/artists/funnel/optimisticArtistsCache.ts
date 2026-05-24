import type { QueryClient } from '@tanstack/react-query'
import type { CrmArtist } from '../../../types'
import type { SignatureStatus } from '../../../data/types'
import { artistsKeys } from '../useArtistsQuery'

type ArtistsListPayload = {
  artists: CrmArtist[]
  stats?: {
    total: number
    signed: number
    unsigned: number
    stuck: number
    unassigned?: number
    popular?: number
    main_bucket?: number
    outside_genre?: number
  }
}

const adjustStats = (
  stats: ArtistsListPayload['stats'],
  prevStatus: SignatureStatus | undefined,
  nextStatus: SignatureStatus | undefined,
): ArtistsListPayload['stats'] => {
  if (!stats || !prevStatus || !nextStatus || prevStatus === nextStatus) return stats
  const next = { ...stats }
  if (prevStatus === 'signed') next.signed = Math.max(0, next.signed - 1)
  if (prevStatus === 'unsigned') next.unsigned = Math.max(0, next.unsigned - 1)
  if (prevStatus === 'stuck') next.stuck = Math.max(0, next.stuck - 1)
  if (nextStatus === 'signed') next.signed += 1
  if (nextStatus === 'unsigned') next.unsigned += 1
  if (nextStatus === 'stuck') next.stuck += 1
  return next
}

export const patchArtistInCache = (
  queryClient: QueryClient,
  id: string,
  patch: Partial<CrmArtist>,
) => {
  const snapshots: { queryKey: readonly unknown[]; data: unknown }[] = []

  queryClient
    .getQueriesData<ArtistsListPayload>({ queryKey: artistsKeys.all })
    .forEach(([queryKey, data]) => {
      if (!data?.artists) return
      snapshots.push({ queryKey, data })

      const target = data.artists.find((artist) => artist.id === id)
      const prevStatus = target?.status
      const nextStatus = patch.status ?? prevStatus

      const artists = data.artists.map((artist) =>
        artist.id === id
          ? {
              ...artist,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : artist,
      )

      const stats = adjustStats(data.stats, prevStatus, nextStatus)

      queryClient.setQueryData(queryKey, { ...data, artists, stats })
    })

  return snapshots
}

export const rollbackArtistCache = (
  queryClient: QueryClient,
  snapshots: { queryKey: readonly unknown[]; data: unknown }[],
) => {
  for (const { queryKey, data } of snapshots) {
    queryClient.setQueryData(queryKey, data)
  }
}
