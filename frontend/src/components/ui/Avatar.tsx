interface AvatarProps {
  initials: string
  color?: string
  size?: number
}

export default function Avatar({ initials, color = 'var(--accent)', size = 28 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: color }}
    >
      {initials}
    </span>
  )
}
