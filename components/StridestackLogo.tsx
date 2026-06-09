import Image from 'next/image'

export default function StridestackLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/logo-icon.png" alt="StrideWork icon" width={28} height={28} className="shrink-0" />
      <span className="text-[20px] font-bold uppercase text-gray-950 leading-none" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>
        STRIDEWORK
      </span>
    </span>
  )
}
