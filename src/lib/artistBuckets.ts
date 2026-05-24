import type { ArtistBucket } from '../data/types'

export type { ArtistBucket }
export type BucketFilter = ArtistBucket | 'all'

export const ARTIST_BUCKETS: ArtistBucket[] = ['popular', 'main', 'outside_genre']

export const BUCKET_META: Record<
  ArtistBucket,
  { label: string; shortLabel: string; tone: string; hint: string }
> = {
  popular: {
    label: 'אומנים פופולריים',
    shortLabel: 'פופולריים',
    tone: 'bucket-popular',
    hint: 'להחתים בהקדם — עדיפות עליונה',
  },
  main: {
    label: 'שאר האומנים',
    shortLabel: 'שאר',
    tone: 'bucket-main',
    hint: 'רשימת העבודה הראשית',
  },
  outside_genre: {
    label: 'מחוץ לז׳אנר',
    shortLabel: 'מחוץ לז׳אנר',
    tone: 'bucket-outside',
    hint: 'חילוני / מזרחי־חילוני',
  },
}

export const POPULAR_LIMIT_OPTIONS = [10, 20, 30] as const
export type PopularLimitOption = (typeof POPULAR_LIMIT_OPTIONS)[number]

export const WORKSPACE_SETTINGS_KEY = 'artist-workspace-settings'

export type WorkspaceSettings = {
  popularLimit: PopularLimitOption
  defaultViewMode: 'segments' | 'cards' | 'table' | 'kanban'
  dashboardLayout: 'compact' | 'comfortable' | 'spacious'
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  popularLimit: 20,
  defaultViewMode: 'kanban',
  dashboardLayout: 'comfortable',
}

export const loadWorkspaceSettings = (): WorkspaceSettings => {
  try {
    const raw = localStorage.getItem(WORKSPACE_SETTINGS_KEY)
    if (!raw) return DEFAULT_WORKSPACE_SETTINGS
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>
    const popularLimit = POPULAR_LIMIT_OPTIONS.includes(
      parsed.popularLimit as PopularLimitOption,
    )
      ? (parsed.popularLimit as PopularLimitOption)
      : DEFAULT_WORKSPACE_SETTINGS.popularLimit

    const defaultViewMode =
      parsed.defaultViewMode === 'cards' ||
      parsed.defaultViewMode === 'table' ||
      parsed.defaultViewMode === 'kanban' ||
      parsed.defaultViewMode === 'segments'
        ? parsed.defaultViewMode
        : DEFAULT_WORKSPACE_SETTINGS.defaultViewMode

    const dashboardLayout =
      parsed.dashboardLayout === 'compact' ||
      parsed.dashboardLayout === 'comfortable' ||
      parsed.dashboardLayout === 'spacious'
        ? parsed.dashboardLayout
        : DEFAULT_WORKSPACE_SETTINGS.dashboardLayout

    return { popularLimit, defaultViewMode, dashboardLayout }
  } catch {
    return DEFAULT_WORKSPACE_SETTINGS
  }
}

export const saveWorkspaceSettings = (settings: WorkspaceSettings) => {
  localStorage.setItem(WORKSPACE_SETTINGS_KEY, JSON.stringify(settings))
}
