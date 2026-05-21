import type { ArtistBucket } from '../../data/types'
import { ARTIST_BUCKETS, BUCKET_META } from '../../lib/artistBuckets'

type ArtistBucketSelectProps = {
  value: ArtistBucket
  onChange: (bucket: ArtistBucket) => void
  compact?: boolean
}

export const ArtistBucketSelect = ({ value, onChange, compact = false }: ArtistBucketSelectProps) => {
  return (
    <label className={`mini-card-field bucket-field ${compact ? 'bucket-field--compact' : ''}`}>
      <span>קטגוריה</span>
      <select
        className="bucket-select"
        value={value}
        aria-label="קטגוריית אומן"
        onChange={(e) => onChange(e.target.value as ArtistBucket)}
      >
        {ARTIST_BUCKETS.map((bucket) => (
          <option key={bucket} value={bucket}>
            {BUCKET_META[bucket].shortLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
