export default function StridestackLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Icon mark */}
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 shrink-0">
        {/* Vertical bar (right side of icon) */}
        <rect x="36" y="4" width="5" height="36" rx="1" fill="#FF3B1E" />
        {/* Asterisk centre */}
        {/* Horizontal arm */}
        <rect x="4" y="19.5" width="28" height="5" rx="1" fill="#FF3B1E" />
        {/* Diagonal \  */}
        <rect
          x="5" y="5"
          width="5" height="30"
          rx="1"
          fill="#FF3B1E"
          transform="rotate(-45 18 22)"
        />
        {/* Diagonal /  */}
        <rect
          x="5" y="5"
          width="5" height="30"
          rx="1"
          fill="#FF3B1E"
          transform="rotate(45 26 22)"
        />
      </svg>
      {/* Wordmark */}
      <span
        className="text-[17px] font-black tracking-tight text-gray-950 leading-none"
        style={{ fontFamily: "'Arial Black', 'Arial', sans-serif", letterSpacing: '-0.02em' }}
      >
        STRIDESTACK
      </span>
    </span>
  )
}
