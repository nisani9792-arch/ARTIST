import type { SignatureStatus } from '../../data/types'
import type { CrmArtist } from '../../types'
import { priorityForStatus } from '../../lib/constants'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistKanbanProps = {
  artists: CrmArtist[]
  statusMeta: StatusMeta
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onOpen: (artist: CrmArtist) => void
}

const columns: SignatureStatus[] = ['unsigned', 'stuck', 'signed']

export const ArtistKanban = ({ artists, statusMeta, onUpdate, onOpen }: ArtistKanbanProps) => {
  const grouped = columns.map((status) => ({
    status,
    meta: statusMeta[status],
    items: artists.filter((artist) => artist.status === status),
  }))

  const handleDrop = (artistId: string, nextStatus: SignatureStatus) => {
    onUpdate(artistId, {
      status: nextStatus,
      priority: priorityForStatus(nextStatus),
    })
  }

  return (
    <div className="kanban-board">
      {grouped.map(({ status, meta, items }) => (
        <section
          key={status}
          className={`kanban-column kanban-${meta.tone}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const artistId = event.dataTransfer.getData('text/artist-id')
            if (artistId) handleDrop(artistId, status)
          }}
        >
          <header className="kanban-column-header">
            <span className={`badge ${meta.tone}`}>{meta.label}</span>
            <span className="kanban-count">{items.length}</span>
          </header>
          <div className="kanban-cards">
            {items.map((artist) => (
              <article
                key={artist.id}
                className="kanban-card"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/artist-id', artist.id)
                }}
                onClick={() => onOpen(artist)}
              >
                <strong>{artist.nameHe || artist.nameEn}</strong>
                <span className="kanban-owner">{artist.owner}</span>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
