import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteArtists,
  bulkPatchArtists,
  createArtist,
  deleteArtist,
  mergeArtists,
  patchArtist,
  revertArtistVersion,
  undoArtistChange,
  type CrmArtist,
} from '../../api/artists'
import type { ArtistBucket, SignatureStatus } from '../../data/types'
import { priorityForStatus } from '../../lib/constants'
import { useToast } from '../../hooks/useToast'
import {
  patchArtistInCache,
  rollbackArtistCache,
} from './funnel/optimisticArtistsCache'
import { artistsKeys } from './useArtistsQuery'

export const useArtistMutations = (operatorName: string | null) => {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()

  const invalidateArtists = async () => {
    await queryClient.invalidateQueries({
      queryKey: artistsKeys.all,
      refetchType: 'active',
    })
  }

  const withOperatorPatch = (patch: Partial<CrmArtist>): Partial<CrmArtist> => {
    if (!operatorName || patch.owner !== undefined) return patch
    return { ...patch, owner: operatorName }
  }

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CrmArtist> }) =>
      patchArtist(id, withOperatorPatch(patch)),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: artistsKeys.all })
      const snapshots = patchArtistInCache(queryClient, id, withOperatorPatch(patch))
      return { snapshots }
    },
    onSuccess: async (_data, { id }) => {
      await invalidateArtists()
      await queryClient.invalidateQueries({ queryKey: artistsKeys.versions(id) })
      pushToast('נשמר בהצלחה', 'success')
    },
    onError: (error, _vars, context) => {
      if (context?.snapshots) rollbackArtistCache(queryClient, context.snapshots)
      pushToast(error instanceof Error ? error.message : 'השמירה נכשלה', 'error')
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CrmArtist>) =>
      createArtist(
        withOperatorPatch({
          ...payload,
          priority: priorityForStatus(payload.status ?? 'unsigned'),
        }),
      ),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('אומן נוסף', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'יצירת אומן נכשלה', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArtist(id),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('נמחק', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'מחיקה נכשלה', 'error')
    },
  })

  const bulkPatchMutation = useMutation({
    mutationFn: ({
      ids,
      status,
      owner,
      bucket,
    }: {
      ids: string[]
      status: SignatureStatus
      owner: string
      bucket?: ArtistBucket
    }) =>
      bulkPatchArtists({
        ids,
        owner,
        status,
        priority: priorityForStatus(status),
        bucket,
      }),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('עודכן בהצלחה', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'עדכון מרוכז נכשל', 'error')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteArtists(ids),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('נמחקו בהצלחה', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'מחיקה מרוכזת נכשלה', 'error')
    },
  })

  const undoMutation = useMutation({
    mutationFn: (id: string) => undoArtistChange(id),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('בוטל השינוי האחרון', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'ביטול נכשל', 'error')
    },
  })

  const revertMutation = useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: number }) =>
      revertArtistVersion(id, versionId),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('שוחזרה גרסה קודמת', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'שחזור נכשל', 'error')
    },
  })

  const mergeMutation = useMutation({
    mutationFn: ({ keepId, removeIds }: { keepId: string; removeIds: string[] }) =>
      mergeArtists(keepId, removeIds),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('כפילויות אוחדו', 'success')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'איחוד כפילויות נכשל', 'error')
    },
  })

  return {
    patchMutation,
    createMutation,
    deleteMutation,
    bulkPatchMutation,
    bulkDeleteMutation,
    undoMutation,
    revertMutation,
    mergeMutation,
    invalidateArtists,
    withOperatorPatch,
  }
}
