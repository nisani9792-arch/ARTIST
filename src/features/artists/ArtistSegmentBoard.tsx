import type { SignatureStatus } from '../../data/types'
import type { ArtistBucket } from '../../data/types'
import type { CrmArtist } from '../../types'
import { ARTIST_BUCKETS, BUCKET_META } from '../../lib/artistBuckets'
import { priorityForStatus } from '../../lib/constants'
import { ArtistBucketSelect } from './ArtistBucketSelect'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistSegmentBoardProps = {
  artists: CrmArtist[]
  handlers: string[]
  statusMeta: StatusMeta
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onOpen: (artist: CrmArtist) => void
}

export const ArtistSegmentBoard = ({
  artists,
  handlers,
  statusMeta,
  selectedIds,
  onToggleSelect,
  onUpdate,
  onOpen,
}: ArtistSegmentBoardProps) => {
  const grouped = ARTIST_BUCKETS.map((bucket) => ({
    bucket,
    meta: BUCKET_META[bucket],
    items: artists.filter((artist) => (artist.bucket ?? 'main') === bucket),
  }))

  const handleDrop = (artistId: string, nextBucket: ArtistBucket) => {
    onUpdate(artistId, { bucket: nextBucket })
  }

  return (
    <div className="segment-board">
      {grouped.map(({ bucket, meta, items }) => (
        <section
          key={bucket}
          className={`segment-column ${meta.tone}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const artistId = event.dataTransfer.getData('text/artist-id')
            if (artistId) handleDrop(artistId, bucket)
          }}
        >
          <header className="segment-column-header">
            <div>
              <h2>{meta.label}</h2>
              <p>{meta.hint}</p>
            </div>
            <span className="segment-count">{items.length}</span>
          </header>

          <div className="segment-cards">
            {items.length === 0 ? (
              <p className="segment-empty">אין אומנים בקטגוריה</p>
            ) : (
              items.map((artist) => {
                const status = statusMeta[artist.status]
                const displayName = artist.nameHe || artist.nameEn || 'ללא שם'

                return (
                  <article
                    key={artist.id}
                    className={`mini-card segment-card ${status.tone} ${
                      selectedIds.has(artist.id) ? 'selected' : ''
                    }`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/artist-id', artist.id)
                    }}
                  >
                    <div className="mini-card-top">
                      <label className="mini-card-check">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(artist.id)}
                          onChange={() => onToggleSelect(artist.id)}
                          aria-label={`בחר ${displayName}`}
                        />
                      </label>
                      <label className="mini-card-status">
                        <select
                          className={`badge-select ${status.tone}`}
                          value={artist.status}
                          aria-label={`סטטוס ${displayName}`}
                          onChange={(e) => {
                            const nextStatus = e.target.value as SignatureStatus
                            onUpdate(artist.id, {
                              status: nextStatus,
                              priority: priorityForStatus(nextStatus),
                            })
                          }}
                        >
                          <option value="signed">חתום</option>
                          <option value="unsigned">לא חתום</option>
                          <option value="stuck">תקוע</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      className="mini-card-open"
                      onClick={() => onOpen(artist)}
                    >
                      <h3 className="mini-card-name" title={displayName}>
                        {displayName}
                      </h3>
                    </button>

                    <ArtistBucketSelect
                      value={artist.bucket ?? 'main'}
                      onChange={(nextBucket) => onUpdate(artist.id, { bucket: nextBucket })}
                    />

                    <label className="mini-card-field">
                      <span>גורם מטפל</span>
                      <select
                        value={artist.owner}
                        onChange={(e) => onUpdate(artist.id, { owner: e.target.value })}
                      >
                        {handlers.map((handler) => (
                          <option key={handler} value={handler}>
                            {handler}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                )
              })
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
