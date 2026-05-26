import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArtistDetailPanel } from '../components/ArtistDetailPanel'
import { ArtistFormModal } from '../components/ArtistFormModal'
import { ArtistVersionHistory } from '../components/ArtistVersionHistory'
import { useArtistMutations } from '../features/artists/useArtistMutations'
import { useArtistDetail, useArtistVersions } from '../features/artists/useArtistsQuery'
import { HANDLERS, STATUS_META, priorityForStatus } from '../lib/constants'
import type { CrmOutletContext } from './CrmLayout'

export const ArtistDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { operatorName } = useOutletContext<CrmOutletContext>()
  const { patchMutation, deleteMutation, undoMutation, revertMutation } =
    useArtistMutations(operatorName)
  const { data: artist, isLoading, refetch } = useArtistDetail(id)
  const { data: versions = [], isLoading: versionsLoading, refetch: refetchVersions } =
    useArtistVersions(id)
  const [formOpen, setFormOpen] = useState(false)

  if (isLoading) {
    return <div className="empty-state">טוען פרטי אומן...</div>
  }

  if (!artist || !id) {
    return (
      <div className="empty-state">
        לא נמצא אומן
        <button className="btn btn-primary" type="button" onClick={() => navigate('/artists')}>
          חזרה לרשימה
        </button>
      </div>
    )
  }

  const handlers = [...new Set([...HANDLERS, artist.owner, operatorName].filter(Boolean))]

  return (
    <>
      <ArtistDetailPanel
        artist={artist}
        statusMeta={STATUS_META}
        onUpdate={(artistId, patch) => {
          patchMutation.mutate(
            { id: artistId, patch },
            {
              onSuccess: () => {
                void refetch()
                void refetchVersions()
              },
            },
          )
        }}
        onClose={() => navigate('/artists')}
        onEdit={() => setFormOpen(true)}
        onDelete={() => {
          if (!window.confirm(`למחוק את "${artist.nameHe || artist.nameEn}"?`)) return
          deleteMutation.mutate(artist.id, {
            onSuccess: () => navigate('/artists'),
          })
        }}
        versionHistory={
          <ArtistVersionHistory
            versions={versions}
            loading={versionsLoading}
            undoPending={undoMutation.isPending}
            revertPending={revertMutation.isPending}
            onUndoLast={() => {
              undoMutation.mutate(id, {
                onSuccess: () => {
                  void refetch()
                  void refetchVersions()
                },
              })
            }}
            onRevert={(versionId) => {
              revertMutation.mutate(
                { id, versionId },
                {
                  onSuccess: () => {
                    void refetch()
                    void refetchVersions()
                  },
                },
              )
            }}
          />
        }
      />

      <AnimatePresence>
        {formOpen && (
          <ArtistFormModal
            mode="edit"
            artist={artist}
            handlers={handlers}
            onClose={() => setFormOpen(false)}
            onSave={async (payload) => {
              await patchMutation.mutateAsync({
                id: artist.id,
                patch: {
                  ...payload,
                  priority: priorityForStatus(payload.status ?? artist.status),
                },
              })
              await refetch()
              await refetchVersions()
              setFormOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
