import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteArtists,
  bulkPatchArtists,
  createArtist,
  deleteArtist,
  patchArtist,
  type CrmArtist,
} from '../../api/artists'
import type { SignatureStatus } from '../../data/types'
import { priorityForStatus } from '../../lib/constants'
import { useToast } from '../../hooks/useToast'
import { artistsKeys } from './useArtistsQuery'

export const useArtistMutations = (operatorName: string | null) => {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()

  const invalidateArtists = async () => {
    await queryClient.invalidateQueries({ queryKey: artistsKeys.all })
  }

  const withOperatorPatch = (patch: Partial<CrmArtist>): Partial<CrmArtist> => {
    if (!operatorName || patch.owner !== undefined) return patch
    return { ...patch, owner: operatorName }
  }

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CrmArtist> }) =>
      patchArtist(id, withOperatorPatch(patch)),
    onSuccess: async () => {
      await invalidateArtists()
      pushToast('נשמר בהצלחה', 'success')
    },
    onError: (error) => {
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
    }: {
      ids: string[]
      status: SignatureStatus
      owner: string
    }) =>
      bulkPatchArtists({
        ids,
        owner,
        status,
        priority: priorityForStatus(status),
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

  return {
    patchMutation,
    createMutation,
    deleteMutation,
    bulkPatchMutation,
    bulkDeleteMutation,
    withOperatorPatch,
  }
}
