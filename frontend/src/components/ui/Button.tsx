import type { LucideIcon } from 'lucide-react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: LucideIcon
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
}

export default function Button({
  variant = 'secondary',
  size,
  icon: Icon,
  children,
  onClick,
  disabled,
  type = 'button',
  className = '',
  style,
}: ButtonProps) {
  const cls = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}${className ? ` ${className}` : ''}`
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  )
}
