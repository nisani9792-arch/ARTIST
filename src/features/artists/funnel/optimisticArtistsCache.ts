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
    in_process: number
    unassigned?: number
    popular?: number
    main_bucket?: number
    outside_genre?: number
  }
}

type BucketKey = 'popular' | 'main_bucket' | 'outside_genre'

const bucketStatKey = (bucket: string | undefined): BucketKey | null => {
  if (bucket === 'popular') return 'popular'
  if (bucket === 'main') return 'main_bucket'
  if (bucket === 'outside_genre') return 'outside_genre'
  return null
}

const adjustStats = (
  stats: ArtistsListPayload['stats'],
  prevStatus: SignatureStatus | undefined,
  nextStatus: SignatureStatus | undefined,
  prevBucket: string | undefined,
  nextBucket: string | undefined,
): ArtistsListPayload['stats'] => {
  if (!stats) return stats
  const next = { ...stats }

  if (prevStatus && nextStatus && prevStatus !== nextStatus) {
    if (prevStatus === 'signed') next.signed = Math.max(0, next.signed - 1)
    if (prevStatus === 'unsigned') next.unsigned = Math.max(0, next.unsigned - 1)
    if (prevStatus === 'in_process') next.in_process = Math.max(0, next.in_process - 1)
    if (nextStatus === 'signed') next.signed += 1
    if (nextStatus === 'unsigned') next.unsigned += 1
    if (nextStatus === 'in_process') next.in_process += 1
  }

  const prevKey = bucketStatKey(prevBucket)
  const nextKey = bucketStatKey(nextBucket)
  if (prevKey && nextKey && prevKey !== nextKey) {
    next[prevKey] = Math.max(0, (next[prevKey] ?? 0) - 1)
    next[nextKey] = (next[nextKey] ?? 0) + 1
  }

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
      const prevBucket = target?.bucket
      const nextBucket = patch.bucket ?? prevBucket

      const artists = data.artists.map((artist) =>
        artist.id === id
          ? {
              ...artist,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : artist,
      )

      const stats = adjustStats(data.stats, prevStatus, nextStatus, prevBucket, nextBucket)

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
