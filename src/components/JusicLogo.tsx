import { cn } from '../lib/cn'

type JusicLogoProps = {
  size?: number
  className?: string
  variant?: 'full' | 'mark'
  title?: string
}

export const JusicLogo = ({
  size = 40,
  className,
  variant = 'full',
  title = 'JUSIC',
}: JusicLogoProps) => {
  const markOnly = variant === 'mark'

  return (
    <svg
      className={cn('jusic-logo', className)}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="jusic-grad-a" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b9dff" />
          <stop offset="0.45" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="jusic-grad-b" x1="14" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" stopOpacity="0.9" />
          <stop offset="1" stopColor="#93c5fd" stopOpacity="0.55" />
        </linearGradient>
        <filter id="jusic-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="14"
        fill="url(#jusic-grad-a)"
        opacity="0.18"
      />
      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="12"
        fill="rgba(255,255,255,0.55)"
        stroke="url(#jusic-grad-a)"
        strokeWidth="1.2"
      />

      <path
        d="M14 30c0-8 4-14 10-14s10 6 10 14"
        stroke="url(#jusic-grad-a)"
        strokeWidth="2.6"
        strokeLinecap="round"
        filter="url(#jusic-glow)"
      />
      <path
        d="M18 30V18c0-3 2-5 5-5"
        stroke="url(#jusic-grad-b)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="23" cy="17" r="2.5" fill="url(#jusic-grad-a)" />

      {!markOnly && (
        <text
          x="24"
          y="43"
          textAnchor="middle"
          fill="url(#jusic-grad-a)"
          fontSize="7"
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
          letterSpacing="0.14em"
        >
          JUSIC
        </text>
      )}
    </svg>
  )
}
