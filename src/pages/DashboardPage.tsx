import { Link } from 'react-router-dom'
import { WorkspaceSettingsPanel } from '../components/WorkspaceSettingsPanel'
import { useArtistsPage } from '../features/artists/useArtistsQuery'
import { BUCKET_META, loadWorkspaceSettings } from '../lib/artistBuckets'
import { HANDLERS, STATUS_META } from '../lib/constants'
import type { CrmArtist } from '../types'

type DashboardPageProps = {
  operatorName: string
}

export const DashboardPage = ({ operatorName }: DashboardPageProps) => {
  const layout = loadWorkspaceSettings().dashboardLayout
  const { data: statsData, refetch } = useArtistsPage({ page: 1, limit: 1 })
  const stats = statsData?.stats

  const { data: myQueueData } = useArtistsPage({
    myQueue: true,
    page: 1,
    limit: 10,
    sort: 'smart',
  })

  const queueArtists = myQueueData?.artists ?? []

  return (
    <main className={`dashboard-page dashboard-layout-${layout}`}>
      <section className="dashboard-hero">
        <div>
          <h1>שלום, {operatorName}</h1>
          <p>סקירה מהירה של מצב האומנים במערכת</p>
        </div>
        <WorkspaceSettingsPanel onSettingsChange={() => void refetch()} />
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
      </section>

      <section className="dashboard-buckets">
        <h2>קטגוריות אומנים</h2>
        <div className="dashboard-buckets-grid">
          <Link className="dashboard-bucket-card bucket-popular" to="/artists?bucket=popular">
            <span>{BUCKET_META.popular.label}</span>
            <strong>{stats?.popular?.toLocaleString('he-IL') ?? '—'}</strong>
            <small>{BUCKET_META.popular.hint}</small>
          </Link>
          <Link className="dashboard-bucket-card bucket-main" to="/artists?bucket=main">
            <span>{BUCKET_META.main.label}</span>
            <strong>{stats?.main_bucket?.toLocaleString('he-IL') ?? '—'}</strong>
            <small>{BUCKET_META.main.hint}</small>
          </Link>
          <Link
            className="dashboard-bucket-card bucket-outside"
            to="/artists?bucket=outside_genre"
          >
            <span>{BUCKET_META.outside_genre.label}</span>
            <strong>{stats?.outside_genre?.toLocaleString('he-IL') ?? '—'}</strong>
            <small>{BUCKET_META.outside_genre.hint}</small>
          </Link>
        </div>
      </section>

      <section className="dashboard-shortcuts">
        <Link className="dashboard-shortcut" to="/artists?bucket=popular">
          פופולריים — להחתים מהר
        </Link>
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
