export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="UML Analysis">
      <defs>
        <linearGradient id="uml-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5BC0BE" />
          <stop offset="1" stopColor="#9FE5E3" />
        </linearGradient>
      </defs>
      <line x1="10" y1="12" x2="30" y2="12" stroke="url(#uml-logo-grad)" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="10" y1="12" x2="20" y2="30" stroke="url(#uml-logo-grad)" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="30" y1="12" x2="20" y2="30" stroke="url(#uml-logo-grad)" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="6" y="8" width="8" height="8" rx="1.5" fill="#0B0F14" stroke="url(#uml-logo-grad)" strokeWidth="1.75" />
      <rect x="26" y="8" width="8" height="8" rx="1.5" fill="#0B0F14" stroke="url(#uml-logo-grad)" strokeWidth="1.75" />
      <rect x="16" y="26" width="8" height="8" rx="1.5" fill="#5BC0BE" stroke="#5BC0BE" strokeWidth="1.75" />
    </svg>
  )
}
