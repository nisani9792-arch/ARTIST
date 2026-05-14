import {
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Search,
  Sparkles,
  UsersRound,
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

const DISPLAY_LIMIT = 240

const handlers = ['לא שויך', 'שימון', 'ניהול זכויות', 'סוכן חיצוני', 'מעקב חוזים', 'שימור קשר']

const statusMeta: Record<
  SignatureStatus,
  { label: string; tone: string; action: string; description: string }
> = {
  signed: {
    label: 'חתום',
    tone: 'green',
    action: 'שימור קשר',
    description: 'האומן חתום ומוכן לניהול קשר שוטף',
  },
  unsigned: {
    label: 'לא חתום',
    tone: 'red',
    action: 'ליצירת קשר',
    description: 'נדרש טיפול מסחרי או משפטי ראשוני',
  },
  stuck: {
    label: 'תקוע',
    tone: 'yellow',
    action: 'פתיחת חסם',
    description: 'יש חסם בתהליך וצריך בעלים ברור',
  },
}

const normalize = (value: string) => value.toLocaleLowerCase('he-IL').trim()

const readInitialArtists = (): CrmArtist[] => {
  return initialArtists.map((artist) => ({ ...artist }))
}

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
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [saveState, setSaveState] = useState('ממתין לסנכרון')

  const loadArtists = async () => {
    setIsLoading(true)
    setServerError('')

    try {
      const serverArtists = await fetchArtists()
      setArtists(serverArtists)
      setSaveState('מסונכרן עם Neon')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'לא ניתן להתחבר לשרת Neon')
      setSaveState('מצב גיבוי מקומי')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    fetchArtists()
      .then((serverArtists) => {
        if (!isActive) {
          return
        }

        setArtists(serverArtists)
        setSaveState('מסונכרן עם Neon')
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        setServerError(error instanceof Error ? error.message : 'לא ניתן להתחבר לשרת Neon')
        setSaveState('מצב גיבוי מקומי')
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const replaceArtists = (updatedArtists: CrmArtist[]) => {
    const updatedById = new Map(updatedArtists.map((artist) => [artist.id, artist]))
    setArtists((currentArtists) =>
      currentArtists.map((artist) => updatedById.get(artist.id) ?? artist),
    )
  }

  const updateArtist = async (artistId: string, patch: Partial<CrmArtist>) => {
    setSaveState('שומר ל-Neon...')
    const nextArtists = artists.map((artist) =>
      artist.id === artistId ? { ...artist, ...patch, updatedAt: new Date().toISOString() } : artist,
    )
    setArtists(nextArtists)

    try {
      const updatedArtist = await patchArtist(artistId, patch)
      replaceArtists([updatedArtist])
      setSaveState('נשמר ב-Neon')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'השמירה ל-Neon נכשלה')
      setSaveState('שגיאת שמירה')
    }
  }

  const stats = useMemo(() => {
    const signed = artists.filter((artist) => artist.status === 'signed').length
    const unsigned = artists.filter((artist) => artist.status === 'unsigned').length
    const stuck = artists.filter((artist) => artist.status === 'stuck').length
    const unassigned = artists.filter((artist) => artist.owner === 'לא שויך').length
    const touched = artists.filter((artist) => artist.updatedAt).length

    return {
      signed,
      unsigned,
      stuck,
      unassigned,
      touched,
      total: artists.length,
      signedRate: Math.round((signed / Math.max(artists.length, 1)) * 100),
    }
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
      tags: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 120),
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
          Math.min(artist.tags.length, 10) * 2 +
          (artist.latestAlbum ? 4 : 0),
      }))

    ranked.sort((a, b) => {
      if (sortBy === 'name') {
        return a.artist.nameHe.localeCompare(b.artist.nameHe, 'he')
      }

      if (sortBy === 'status') {
        return a.artist.status.localeCompare(b.artist.status)
      }

      if (sortBy === 'tags') {
        return b.artist.tags.length - a.artist.tags.length
      }

      return b.score - a.score
    })

    return ranked.map(({ artist }) => artist)
  }, [artists, genreFilter, needsActionOnly, ownerFilter, query, sortBy, statusFilter, tagFilter])

  const visibleArtists = filteredArtists.slice(0, DISPLAY_LIMIT)
  const selectedCount = selectedIds.size

  const smartLeads = useMemo(
    () =>
      filteredArtists
        .filter((artist) => artist.status !== 'signed')
        .slice(0, 3)
        .map((artist) => artist.nameHe || artist.nameEn),
    [filteredArtists],
  )

  const toggleSelected = (artistId: string) => {
    const next = new Set(selectedIds)
    if (next.has(artistId)) {
      next.delete(artistId)
    } else {
      next.add(artistId)
    }
    setSelectedIds(next)
  }

  const selectVisible = () => {
    setSelectedIds(new Set(visibleArtists.map((artist) => artist.id)))
  }

  const applyBulkTreatment = async () => {
    if (selectedCount === 0) {
      return
    }

    setSaveState('שומר טיפול מרוכז...')
    const nextArtists = artists.map((artist) =>
      selectedIds.has(artist.id)
        ? {
            ...artist,
            status: bulkStatus,
            owner: bulkOwner,
            priority: statusMeta[bulkStatus].action,
            updatedAt: new Date().toISOString(),
          }
        : artist,
    )

    setArtists(nextArtists)

    try {
      const updatedArtists = await bulkPatchArtists({
        ids: [...selectedIds],
        owner: bulkOwner,
        priority: statusMeta[bulkStatus].action,
        status: bulkStatus,
      })
      replaceArtists(updatedArtists)
      setSelectedIds(new Set())
      setSaveState('הטיפול המרוכז נשמר ב-Neon')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'טיפול מרוכז נכשל')
      setSaveState('שגיאת שמירה')
    }
  }

  const refreshFromServer = () => {
    void loadArtists()
    setSelectedIds(new Set())
  }

  const exportCsv = () => {
    const headers = ['שם', 'שם באנגלית', 'סטטוס', 'גורם מטפל', 'זאנרים', 'תגיות', 'אלבום אחרון', 'הערות']
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

  return (
    <main className="app-shell" dir="rtl">
      <section className="hero-panel" aria-labelledby="app-title">
        <div className="brand-row">
          <img src="/artist-logo.png" className="brand-logo" alt="ARTIST" />
          <div>
            <p className="eyebrow">מערכת CRM לאומנים</p>
            <h1 id="app-title">ARTIST</h1>
          </div>
        </div>
        <div className="hero-copy">
          <p>
            מרכז עבודה אחד לניהול אומנים חתומים, לא חתומים ותקועים, עם חיפוש מהיר,
            סינון מתקדם וטיפול מרוכז.
          </p>
          <div className="sync-line">
            <span className={`sync-pill ${serverError ? 'error' : 'ok'}`}>
              {isLoading ? 'טוען מ-Neon...' : saveState}
            </span>
            {serverError && <span className="sync-error">יש בעיית שרת, מוצג גיבוי מקומי</span>}
          </div>
          <div className="hero-actions">
            <button className="primary-action" onClick={selectVisible} type="button">
              בחר את התוצאות
            </button>
            <button className="ghost-action" onClick={exportCsv} type="button">
              <Download size={18} />
              ייצוא CSV
            </button>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="מדדי CRM">
        <article className="stat-card">
          <UsersRound size={22} />
          <span>סה״כ אומנים</span>
          <strong>{stats.total.toLocaleString('he-IL')}</strong>
        </article>
        <article className="stat-card green">
          <CheckCircle2 size={22} />
          <span>חתומים</span>
          <strong>{stats.signed.toLocaleString('he-IL')}</strong>
        </article>
        <article className="stat-card red">
          <ClipboardList size={22} />
          <span>לא חתומים</span>
          <strong>{stats.unsigned.toLocaleString('he-IL')}</strong>
        </article>
        <article className="stat-card yellow">
          <Sparkles size={22} />
          <span>תקועים</span>
          <strong>{stats.stuck.toLocaleString('he-IL')}</strong>
        </article>
      </section>

      <section className="smart-panel">
        <div>
          <p className="eyebrow">תובנות חכמות</p>
          <h2>{stats.signedRate}% חתומים מתוך המאגר</h2>
          <p>
            {stats.unassigned.toLocaleString('he-IL')} אומנים עדיין ללא גורם מטפל.
            {stats.touched > 0 && ` ${stats.touched.toLocaleString('he-IL')} כרטיסים עודכנו ידנית.`}
          </p>
        </div>
        <div className="lead-chips" aria-label="המלצות לטיפול">
          {smartLeads.map((lead) => (
            <span key={lead}>לטפל עכשיו: {lead}</span>
          ))}
        </div>
      </section>

      <section className="workspace">
        <aside className="filters-panel" aria-label="סינון מתקדם">
          <div className="panel-title">
            <Filter size={20} />
            <h2>סינון מתקדם</h2>
          </div>

          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חיפוש שם, תגית, ז׳אנר, אלבום או מטפל"
            />
          </label>

          <label>
            סטטוס
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">כל הסטטוסים</option>
              <option value="signed">חתום</option>
              <option value="unsigned">לא חתום</option>
              <option value="stuck">תקוע</option>
            </select>
          </label>

          <label>
            גורם מטפל
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="all">כל המטפלים</option>
              {filterOptions.owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>

          <label>
            תגית מובילה
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">כל התגיות</option>
              {filterOptions.tags.map(([tag, count]) => (
                <option key={tag} value={tag}>
                  {tag} ({count})
                </option>
              ))}
            </select>
          </label>

          <label>
            ז׳אנר
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="all">כל הז׳אנרים</option>
              {filterOptions.genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label>
            מיון
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
              <option value="smart">חכם: דחיפות + פוטנציאל</option>
              <option value="name">שם א-ת</option>
              <option value="status">לפי סטטוס</option>
              <option value="tags">לפי כמות תגיות</option>
            </select>
          </label>

          <label className="toggle-line">
            <input
              type="checkbox"
              checked={needsActionOnly}
              onChange={(event) => setNeedsActionOnly(event.target.checked)}
            />
            הצג רק כרטיסים שדורשים פעולה
          </label>

          <button className="ghost-action wide" onClick={refreshFromServer} type="button">
            רענון מ-Neon
          </button>
        </aside>

        <section className="crm-board" aria-label="כרטיסיות אומנים">
          <div className="board-toolbar">
            <div>
              <p className="eyebrow">תוצאות</p>
              <h2>
                {filteredArtists.length.toLocaleString('he-IL')} אומנים נמצאו
                {filteredArtists.length > DISPLAY_LIMIT && `, מוצגים ${DISPLAY_LIMIT}`}
              </h2>
            </div>

            <div className="bulk-box">
              <span>{selectedCount.toLocaleString('he-IL')} נבחרו</span>
              <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as SignatureStatus)}>
                <option value="signed">חתום</option>
                <option value="unsigned">לא חתום</option>
                <option value="stuck">תקוע</option>
              </select>
              <select value={bulkOwner} onChange={(event) => setBulkOwner(event.target.value)}>
                {handlers.map((handler) => (
                  <option key={handler} value={handler}>
                    {handler}
                  </option>
                ))}
              </select>
              <button className="primary-action" onClick={applyBulkTreatment} type="button">
                טיפול מרוכז
              </button>
            </div>
          </div>

          <div className="cards-grid">
            {visibleArtists.map((artist) => {
              const meta = statusMeta[artist.status]

              return (
                <article className={`artist-card ${meta.tone}`} key={artist.id}>
                  <div className="card-topline">
                    <label className="select-card" aria-label={`בחר ${artist.nameHe}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(artist.id)}
                        onChange={() => toggleSelected(artist.id)}
                      />
                    </label>
                    <span className={`status-light ${meta.tone}`} title={meta.description} />
                    <span>{meta.label}</span>
                  </div>

                  <h3>{artist.nameHe || artist.nameEn}</h3>
                  {artist.nameEn && <p className="english-name">{artist.nameEn}</p>}

                  <div className="mini-meta">
                    <span>{artist.latestAlbum || 'אין אלבום אחרון'}</span>
                    <span>{artist.tags.length.toLocaleString('he-IL')} תגיות</span>
                  </div>

                  <div className="chips">
                    {[...artist.genres, ...artist.tags].slice(0, 4).map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>

                  <div className="card-controls">
                    <label>
                      גורם מטפל
                      <select
                        value={artist.owner}
                        onChange={(event) => updateArtist(artist.id, { owner: event.target.value })}
                      >
                        {handlers.map((handler) => (
                          <option key={handler} value={handler}>
                            {handler}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      סטטוס
                      <select
                        value={artist.status}
                        onChange={(event) =>
                          updateArtist(artist.id, {
                            status: event.target.value as SignatureStatus,
                            priority: statusMeta[event.target.value as SignatureStatus].action,
                          })
                        }
                      >
                        <option value="signed">חתום</option>
                        <option value="unsigned">לא חתום</option>
                        <option value="stuck">תקוע</option>
                      </select>
                    </label>
                  </div>

                  <textarea
                    value={artist.notes}
                    onChange={(event) => updateArtist(artist.id, { notes: event.target.value })}
                    placeholder="הערת טיפול קצרה"
                    rows={2}
                  />
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
