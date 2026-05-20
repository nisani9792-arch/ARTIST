import { cn } from '../lib/cn'
import { APP_LOGO_SRC, APP_NAME } from '../lib/branding'

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
  title = APP_NAME,
}: JusicLogoProps) => {
  const showWordmark = variant === 'full'

  return (
    <img
      className={cn('jusic-logo', showWordmark && 'jusic-logo--full', className)}
      src={APP_LOGO_SRC}
      width={size}
      height={size}
      alt={title}
      title={title}
      decoding="async"
      draggable={false}
    />
  )
}
