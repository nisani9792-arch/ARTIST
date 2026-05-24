import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { priorityForStatus } from '../../../lib/constants'
import { FUNNEL_STATUSES } from './artistFunnelUtils'
import { ArtistFunnelCard } from './ArtistFunnelCard'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type SummaryFocus = SignatureStatus | 'all'

type ArtistStatusFunnelProps = {
  artists: CrmArtist[]
  statusMeta: StatusMeta
  stats?: { signed: number; unsigned: number; stuck: number; total: number }
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onOpenDetail: (artist: CrmArtist) => void
}

export const ArtistStatusFunnel = ({
  artists,
  statusMeta,
  stats,
  onUpdate,
  onOpenDetail,
}: ArtistStatusFunnelProps) => {
  const [summaryFocus, setSummaryFocus] = useState<SummaryFocus>('all')

  const counts = useMemo(() => {
    if (stats) {
      return {
        signed: stats.signed,
        unsigned: stats.unsigned,
        stuck: stats.stuck,
        total: stats.total,
      }
    }
    return {
      signed: artists.filter((a) => a.status === 'signed').length,
      unsigned: artists.filter((a) => a.status === 'unsigned').length,
      stuck: artists.filter((a) => a.status === 'stuck').length,
      total: artists.length,
    }
  }, [artists, stats])

  const visibleStatuses = summaryFocus === 'all' ? FUNNEL_STATUSES : [summaryFocus]

  const grouped = FUNNEL_STATUSES.map((status) => ({
    status,
    meta: statusMeta[status],
    items: artists.filter((artist) => artist.status === status),
  }))

  const mobileStack = useMemo(() => {
    const order: Record<SignatureStatus, number> = { unsigned: 0, stuck: 1, signed: 2 }
    return [...artists]
      .filter((a) => summaryFocus === 'all' || a.status === summaryFocus)
      .sort((a, b) => order[a.status] - order[b.status])
  }, [artists, summaryFocus])

  const handleStatusChange = (id: string, status: SignatureStatus) => {
    onUpdate(id, { status, priority: priorityForStatus(status) })
  }

  const handleDrop = (artistId: string, nextStatus: SignatureStatus) => {
    handleStatusChange(artistId, nextStatus)
  }

  const summaryChips: { key: SummaryFocus; label: string; count: number; tone: string }[] = [
    { key: 'all', label: 'הכל', count: counts.total, tone: 'all' },
    { key: 'unsigned', label: statusMeta.unsigned.label, count: counts.unsigned, tone: 'unsigned' },
    { key: 'stuck', label: statusMeta.stuck.label, count: counts.stuck, tone: 'stuck' },
    { key: 'signed', label: statusMeta.signed.label, count: counts.signed, tone: 'signed' },
  ]

  return (
    <div className="status-funnel">
      <div className="funnel-summary" role="tablist" aria-label="סיכום משפך">
        {summaryChips.map(({ key, label, count, tone }) => (
          <motion.button
            key={key}
            type="button"
            role="tab"
            aria-selected={summaryFocus === key}
            className={`funnel-summary-chip funnel-summary-chip--${tone} ${
              summaryFocus === key ? 'active' : ''
            }`}
            onClick={() => setSummaryFocus(key)}
            whileTap={{ scale: 0.97 }}
            layout
          >
            <span className="funnel-summary-label">{label}</span>
            <span className="funnel-summary-count">{count.toLocaleString('he-IL')}</span>
          </motion.button>
        ))}
      </div>

      {/* Desktop: Kanban columns */}
      <div className="funnel-kanban desktop-only" aria-hidden={false}>
        {grouped
          .filter(({ status }) => visibleStatuses.includes(status))
          .map(({ status, meta, items }) => (
            <section
              key={status}
              className={`funnel-column funnel-column--${meta.tone} ${
                summaryFocus !== 'all' && summaryFocus !== status ? 'dimmed' : ''
              }`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const artistId = event.dataTransfer.getData('text/artist-id')
                if (artistId) handleDrop(artistId, status)
              }}
            >
              <header className="funnel-column-header">
                <span className={`badge ${meta.tone}`}>{meta.label}</span>
                <span className="funnel-column-count">{items.length}</span>
              </header>
              <div className="funnel-column-cards">
                {items.length === 0 ? (
                  <p className="funnel-empty">אין אומנים בשלב זה</p>
                ) : (
                  items.map((artist) => (
                    <ArtistFunnelCard
                      key={artist.id}
                      artist={artist}
                      draggable
                      onDragStart={(event, id) => {
                        event.dataTransfer.setData('text/artist-id', id)
                      }}
                      onStatusChange={handleStatusChange}
                      onOpenDetail={onOpenDetail}
                      onContractAction={onOpenDetail}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
      </div>

      {/* Mobile: vertical card stack */}
      <div className="funnel-stack mobile-only">
        {mobileStack.length === 0 ? (
          <p className="funnel-empty">אין אומנים לפי הסינון</p>
        ) : (
          mobileStack.map((artist) => (
            <ArtistFunnelCard
              key={artist.id}
              artist={artist}
              onStatusChange={handleStatusChange}
              onOpenDetail={onOpenDetail}
              onContractAction={onOpenDetail}
            />
          ))
        )}
      </div>
    </div>
  )
}
