import { Link } from 'react-router-dom'
import { useArtistsPage } from '../features/artists/useArtistsQuery'
import { HANDLERS, STATUS_META } from '../lib/constants'
import type { CrmArtist } from '../types'

type DashboardPageProps = {
  operatorName: string
}

export const DashboardPage = ({ operatorName }: DashboardPageProps) => {
  const { data: statsData } = useArtistsPage({ page: 1, limit: 1 })
  const stats = statsData?.stats

  const { data: myQueueData } = useArtistsPage({
    myQueue: true,
    page: 1,
    limit: 10,
    sort: 'smart',
  })

  const queueArtists = myQueueData?.artists ?? []

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <h1>שלום, {operatorName}</h1>
        <p>סקירה מהירה של מצב האומנים במערכת</p>
      </section>

      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <span>סה״כ אומנים</span>
          <strong>{stats?.total.toLocaleString('he-IL') ?? '—'}</strong>
        </article>
        <article className="dashboard-stat-card signed">
          <span>חתומים</span>
          <strong>{stats?.signed.toLocaleString('he-IL') ?? '—'}</strong>
        </article>
        <article className="dashboard-stat-card unsigned">
          <span>לא חתומים</span>
          <strong>{stats?.unsigned.toLocaleString('he-IL') ?? '—'}</strong>
        </article>
        <article className="dashboard-stat-card stuck">
          <span>תקועים</span>
          <strong>{stats?.stuck.toLocaleString('he-IL') ?? '—'}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span>לא שויכו</span>
          <strong>{stats?.unassigned.toLocaleString('he-IL') ?? '—'}</strong>
        </article>
      </section>

      <section className="dashboard-shortcuts">
        <Link className="dashboard-shortcut" to="/artists?myQueue=true">
          העבודה שלי
        </Link>
        <Link className="dashboard-shortcut" to="/artists?status=stuck">
          תקועים
        </Link>
        <Link className="dashboard-shortcut" to="/artists?needsAction=true">
          דורש פעולה
        </Link>
        <Link className="dashboard-shortcut" to="/artists">
          כל האומנים
        </Link>
      </section>

      <section className="dashboard-queue">
        <div className="dashboard-section-header">
          <h2>דורש טיפול שלי</h2>
          <Link to="/artists?myQueue=true">הצג הכל</Link>
        </div>
        {queueArtists.length === 0 ? (
          <p className="dashboard-empty">אין פריטים בתור שלך כרגע</p>
        ) : (
          <ul className="dashboard-queue-list">
            {queueArtists.map((artist: CrmArtist) => (
              <li key={artist.id}>
                <Link to={`/artists/${artist.id}`} className="dashboard-queue-item">
                  <span className={`badge ${STATUS_META[artist.status].tone}`}>
                    {STATUS_META[artist.status].label}
                  </span>
                  <span>{artist.nameHe || artist.nameEn}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="dashboard-footnote">גורמי מטפל: {HANDLERS.join(' · ')}</p>
    </main>
  )
}
