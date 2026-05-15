import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { initialArtists, type ArtistRecord, type SignatureStatus } from './data/artists'
import { bulkPatchArtists, fetchArtists, patchArtist } from './api/artists'

type CrmArtist = ArtistRecord & {
  updatedAt?: string
}

type StatusFilter = SignatureStatus | 'all'
type OwnerFilter = string | 'all'
type SortOption = 'smart' | 'name' | 'status' | 'tags'
type SaveStatus = 'idle' | 'loading' | 'saving' | 'error'

const PAGE_SIZES = [50, 100, 200] as const

const handlers = ['לא שויך', 'שימון', 'ניהול זכויות', 'סוכן חיצוני', 'מעקב חוזים', 'שימור קשר']

const statusMeta: Record<SignatureStatus, { label: string; tone: string }> = {
  signed: { label: 'חתום', tone: 'signed' },
  unsigned: { label: 'לא חתום', tone: 'unsigned' },
  stuck: { label: 'תקוע', tone: 'stuck' },
}

const normalize = (value: string) => value.toLocaleLowerCase('he-IL').trim()

const readInitialArtists = (): CrmArtist[] =>
  initialArtists.map((artist) => ({ ...artist }))

const formatCsvValue = (value: string | string[]) => {
  const text = Array.isArray(value) ? value.join(', ') : value
  return `"${text.replace(/"/g, '""')}"`
}

function App() {
  const [artists, setArtists] = useState<CrmArtist[]>(readInitialArtists)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')
  const [needsActionOnly, setNeedsActionOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('smart')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<SignatureStatus>('unsigned')
  const [bulkOwner, setBulkOwner] = useState('שימון')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading')
  const [serverError, setServerError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(50)

  const loadArtists = async () => {
    setSaveStatus('loading')
    setServerError('')

    try {
      const serverArtists = await fetchArtists()
      setArtists(serverArtists)
      setSaveStatus('idle')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'לא ניתן להתחבר לשרת')
      setSaveStatus('error')
    }
  }

  useEffect(() => {
    let isActive = true

    fetchArtists()
      .then((serverArtists) => {
        if (!isActive) return
        setArtists(serverArtists)
        setSaveStatus('idle')
      })
      .catch((error) => {
        if (!isActive) return
        setServerError(error instanceof Error ? error.message : 'לא ניתן להתחבר לשרת')
        setSaveStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [])

  const replaceArtists = (updatedArtists: CrmArtist[]) => {
    const updatedById = new Map(updatedArtists.map((artist) => [artist.id, artist]))
    setArtists((current) => current.map((artist) => updatedById.get(artist.id) ?? artist))
  }

  const updateArtist = async (artistId: string, patch: Partial<CrmArtist>) => {
    setSaveStatus('saving')
    setArtists((current) =>
      current.map((artist) =>
        artist.id === artistId
          ? { ...artist, ...patch, updatedAt: new Date().toISOString() }
          : artist,
      ),
    )

    try {
      const updatedArtist = await patchArtist(artistId, patch)
      replaceArtists([updatedArtist])
      setSaveStatus('idle')
      setServerError('')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'השמירה נכשלה')
      setSaveStatus('error')
    }
  }

  const stats = useMemo(() => {
    const signed = artists.filter((a) => a.status === 'signed').length
    const unsigned = artists.filter((a) => a.status === 'unsigned').length
    const stuck = artists.filter((a) => a.status === 'stuck').length
    const unassigned = artists.filter((a) => a.owner === 'לא שויך').length

    return { signed, unsigned, stuck, unassigned, total: artists.length }
  }, [artists])

  const filterOptions = useMemo(() => {
    const tags = new Map<string, number>()
    const genres = new Set<string>()
    const owners = new Set(handlers)

    for (const artist of artists) {
      artist.tags.forEach((tag) => tags.set(tag, (tags.get(tag) ?? 0) + 1))
      artist.genres.forEach((genre) => genres.add(genre))
      owners.add(artist.owner)
    }

    return {
      tags: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80),
      genres: [...genres].sort((a, b) => a.localeCompare(b, 'he')),
      owners: [...owners],
    }
  }, [artists])

  const filteredArtists = useMemo(() => {
    const normalizedQuery = normalize(query)

    const ranked = artists
      .filter((artist) => {
        const haystack = normalize(
          [
            artist.nameHe,
            artist.nameEn,
            artist.latestAlbum,
            artist.owner,
            artist.source,
            artist.priority,
            artist.notes,
            ...artist.genres,
            ...artist.tags,
          ].join(' '),
        )

        const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery)
        const matchesStatus = statusFilter === 'all' || artist.status === statusFilter
        const matchesOwner = ownerFilter === 'all' || artist.owner === ownerFilter
        const matchesTag = tagFilter === 'all' || artist.tags.includes(tagFilter)
        const matchesGenre = genreFilter === 'all' || artist.genres.includes(genreFilter)
        const matchesAction =
          !needsActionOnly || artist.status !== 'signed' || artist.owner === 'לא שויך'

        return (
          matchesSearch &&
          matchesStatus &&
          matchesOwner &&
          matchesTag &&
          matchesGenre &&
          matchesAction
        )
      })
      .map((artist) => ({
        artist,
        score:
          (artist.status === 'stuck' ? 70 : 0) +
          (artist.status === 'unsigned' ? 45 : 0) +
          (artist.owner === 'לא שויך' ? 25 : 0) +
          Math.min(artist.tags.length, 10) * 2,
      }))

    ranked.sort((a, b) => {
      if (sortBy === 'name') return a.artist.nameHe.localeCompare(b.artist.nameHe, 'he')
      if (sortBy === 'status') return a.artist.status.localeCompare(b.artist.status)
      if (sortBy === 'tags') return b.artist.tags.length - a.artist.tags.length
      return b.score - a.score
    })

    return ranked.map(({ artist }) => artist)
  }, [artists, genreFilter, needsActionOnly, ownerFilter, query, sortBy, statusFilter, tagFilter])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, ownerFilter, tagFilter, genreFilter, needsActionOnly, sortBy, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleArtists = filteredArtists.slice(pageStart, pageStart + pageSize)
  const selectedCount = selectedIds.size

  const toggleSelected = (artistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(artistId)) next.delete(artistId)
      else next.add(artistId)
      return next
    })
  }

  const togglePageSelection = () => {
    const pageIds = visibleArtists.map((a) => a.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const applyBulkTreatment = async () => {
    if (selectedCount === 0) return

    setSaveStatus('saving')
    setArtists((current) =>
      current.map((artist) =>
        selectedIds.has(artist.id)
          ? {
              ...artist,
              status: bulkStatus,
              owner: bulkOwner,
              priority:
                bulkStatus === 'signed'
                  ? 'שימור קשר'
                  : bulkStatus === 'stuck'
                    ? 'פתיחת חסם'
                    : 'ליצירת קשר',
              updatedAt: new Date().toISOString(),
            }
          : artist,
      ),
    )

    try {
      const updatedArtists = await bulkPatchArtists({
        ids: [...selectedIds],
        owner: bulkOwner,
        priority:
          bulkStatus === 'signed'
            ? 'שימור קשר'
            : bulkStatus === 'stuck'
              ? 'פתיחת חסם'
              : 'ליצירת קשר',
        status: bulkStatus,
      })
      replaceArtists(updatedArtists)
      setSelectedIds(new Set())
      setSaveStatus('idle')
      setServerError('')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'טיפול מרוכז נכשל')
      setSaveStatus('error')
    }
  }

  const exportCsv = () => {
    const headers = ['שם', 'שם באנגלית', 'סטטוס', 'גורם מטפל', 'זאנרים', 'תגיות', 'אלבום', 'הערות']
    const rows = filteredArtists.map((artist) => [
      artist.nameHe,
      artist.nameEn,
      statusMeta[artist.status].label,
      artist.owner,
      artist.genres,
      artist.tags,
      artist.latestAlbum,
      artist.notes,
    ])
    const csv = [headers, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'artist-crm-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const pageAllSelected =
    visibleArtists.length > 0 && visibleArtists.every((a) => selectedIds.has(a.id))

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <div className="brand">
          <img src="/artist-logo.png" className="brand-logo" alt="ARTIST" width={32} height={32} />
          <span className="brand-title">ARTIST</span>
        </div>

        <div className="header-stats" aria-label="סיכום">
          <span className="stat-pill">
            סה״כ <strong>{stats.total.toLocaleString('he-IL')}</strong>
          </span>
          <span className="stat-pill signed">
            חתומים <strong>{stats.signed.toLocaleString('he-IL')}</strong>
          </span>
          <span className="stat-pill unsigned">
            לא חתומים <strong>{stats.unsigned.toLocaleString('he-IL')}</strong>
          </span>
          <span className="stat-pill stuck">
            תקועים <strong>{stats.stuck.toLocaleString('he-IL')}</strong>
          </span>
          <span className="stat-pill">
            ללא מטפל <strong>{stats.unassigned.toLocaleString('he-IL')}</strong>
          </span>
        </div>

        <div className="header-actions">
          <span
            className={`status-dot ${saveStatus}`}
            title={
              saveStatus === 'loading'
                ? 'טוען'
                : saveStatus === 'saving'
                  ? 'שומר'
                  : saveStatus === 'error'
                    ? 'שגיאה'
                    : 'מחובר'
            }
          />
          <button
            className="btn btn-ghost btn-icon"
            type="button"
            onClick={() => void loadArtists()}
            title="רענון"
          >
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-ghost" type="button" onClick={exportCsv}>
            <Download size={14} />
            ייצוא
          </button>
        </div>
      </header>

      {serverError && <div className="app-alert">{serverError}</div>}

      <div className="toolbar">
        <label className="search-field">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש שם, תגית, ז׳אנר..."
          />
        </label>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">כל הסטטוסים</option>
          <option value="signed">חתום</option>
          <option value="unsigned">לא חתום</option>
          <option value="stuck">תקוע</option>
        </select>

        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value="all">כל המטפלים</option>
          {filterOptions.owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>

        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="all">כל התגיות</option>
          {filterOptions.tags.map(([tag, count]) => (
            <option key={tag} value={tag}>
              {tag} ({count})
            </option>
          ))}
        </select>

        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="all">כל הז׳אנרים</option>
          {filterOptions.genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          <option value="smart">מיון חכם</option>
          <option value="name">שם</option>
          <option value="status">סטטוס</option>
          <option value="tags">תגיות</option>
        </select>

        <label className="toolbar-check">
          <input
            type="checkbox"
            checked={needsActionOnly}
            onChange={(e) => setNeedsActionOnly(e.target.checked)}
          />
          דורש פעולה
        </label>

        {selectedCount > 0 && (
          <>
            <span className="toolbar-divider" />
            <div className="bulk-bar">
              <span>{selectedCount} נבחרו</span>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as SignatureStatus)}>
                <option value="signed">חתום</option>
                <option value="unsigned">לא חתום</option>
                <option value="stuck">תקוע</option>
              </select>
              <select value={bulkOwner} onChange={(e) => setBulkOwner(e.target.value)}>
                {handlers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={() => void applyBulkTreatment()}>
                החל
              </button>
            </div>
          </>
        )}
      </div>

      <div className="app-body">
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={togglePageSelection}
                    aria-label="בחר עמוד"
                  />
                </th>
                <th className="col-status">סטטוס</th>
                <th className="col-name">שם</th>
                <th className="col-en">אנגלית</th>
                <th className="col-tags">ז׳אנר / תגיות</th>
                <th className="col-album">אלבום</th>
                <th className="col-owner">מטפל</th>
                <th className="col-status-select">עדכון</th>
                <th className="col-notes">הערות</th>
              </tr>
            </thead>
            <tbody>
              {visibleArtists.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      {saveStatus === 'loading' ? 'טוען נתונים...' : 'לא נמצאו אומנים לפי הסינון'}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleArtists.map((artist) => {
                  const meta = statusMeta[artist.status]
                  const tagText = [...artist.genres, ...artist.tags].slice(0, 4).join(' · ')

                  return (
                    <tr key={artist.id} className={selectedIds.has(artist.id) ? 'selected' : undefined}>
                      <td className="col-check">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(artist.id)}
                          onChange={() => toggleSelected(artist.id)}
                          aria-label={`בחר ${artist.nameHe}`}
                        />
                      </td>
                      <td className="col-status">
                        <span className={`badge ${meta.tone}`}>{meta.label}</span>
                      </td>
                      <td className="col-name">
                        <span className="name-cell" title={artist.nameHe}>
                          {artist.nameHe || artist.nameEn}
                        </span>
                      </td>
                      <td className="col-en">
                        <span className="tag-line" title={artist.nameEn}>
                          {artist.nameEn}
                        </span>
                      </td>
                      <td className="col-tags">
                        <span className="tag-line" title={tagText}>
                          {tagText || '—'}
                        </span>
                      </td>
                      <td className="col-album">
                        <span className="tag-line" title={artist.latestAlbum}>
                          {artist.latestAlbum || '—'}
                        </span>
                      </td>
                      <td className="col-owner">
                        <select
                          className="cell-select"
                          value={artist.owner}
                          onChange={(e) => void updateArtist(artist.id, { owner: e.target.value })}
                        >
                          {handlers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="col-status-select">
                        <select
                          className="cell-select"
                          value={artist.status}
                          onChange={(e) => {
                            const status = e.target.value as SignatureStatus
                            void updateArtist(artist.id, {
                              status,
                              priority:
                                status === 'signed'
                                  ? 'שימור קשר'
                                  : status === 'stuck'
                                    ? 'פתיחת חסם'
                                    : 'ליצירת קשר',
                            })
                          }}
                        >
                          <option value="signed">חתום</option>
                          <option value="unsigned">לא חתום</option>
                          <option value="stuck">תקוע</option>
                        </select>
                      </td>
                      <td className="col-notes">
                        <input
                          className="cell-notes"
                          value={artist.notes}
                          onChange={(e) =>
                            setArtists((current) =>
                              current.map((a) =>
                                a.id === artist.id ? { ...a, notes: e.target.value } : a,
                              ),
                            )
                          }
                          onBlur={(e) => void updateArtist(artist.id, { notes: e.target.value })}
                          placeholder="הערה"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="table-footer">
        <span>
          {filteredArtists.length.toLocaleString('he-IL')} תוצאות
          {filteredArtists.length > 0 && ` · עמוד ${safePage} מתוך ${totalPages}`}
        </span>

        <div className="pagination">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])}
            aria-label="שורות בעמוד"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} בשורה
              </option>
            ))}
          </select>
          <button
            className="btn btn-icon"
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="עמוד קודם"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-icon"
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="עמוד הבא"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App
