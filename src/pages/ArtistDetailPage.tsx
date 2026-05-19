import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArtistDetailPanel } from '../components/ArtistDetailPanel'
import { ArtistFormModal } from '../components/ArtistFormModal'
import { fetchArtistById } from '../api/artists'
import { useArtistMutations } from '../features/artists/useArtistMutations'
import { HANDLERS, STATUS_META, priorityForStatus } from '../lib/constants'
import type { CrmOutletContext } from './CrmLayout'
import type { CrmArtist } from '../types'

export const ArtistDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { operatorName } = useOutletContext<CrmOutletContext>()
  const { patchMutation, deleteMutation } = useArtistMutations(operatorName)
  const [artist, setArtist] = useState<CrmArtist | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchArtistById(id)
      .then(setArtist)
      .catch(() => setArtist(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="empty-state">טוען פרטי אומן...</div>
  }

  if (!artist) {
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
        onClose={() => navigate('/artists')}
        onEdit={() => setFormOpen(true)}
        onDelete={() => {
          if (!window.confirm(`למחוק את "${artist.nameHe || artist.nameEn}"?`)) return
          deleteMutation.mutate(artist.id, {
            onSuccess: () => navigate('/artists'),
          })
        }}
      />

      {formOpen && (
        <ArtistFormModal
          mode="edit"
          artist={artist}
          handlers={handlers}
          onClose={() => setFormOpen(false)}
          onSave={async (payload) => {
            const updated = await patchMutation.mutateAsync({
              id: artist.id,
              patch: {
                ...payload,
                priority: priorityForStatus(payload.status ?? artist.status),
              },
            })
            setArtist(updated)
            setFormOpen(false)
          }}
        />
      )}
    </>
  )
}
