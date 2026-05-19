export const ArtistsSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="cards-grid skeleton-grid" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-line skeleton-line-sm" />
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line skeleton-line-md" />
        </div>
      ))}
    </div>
  )
}
