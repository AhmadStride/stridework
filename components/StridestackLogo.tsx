import Image from 'next/image'

export default function StridestackLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/logo-icon.png" alt="StrideWork icon" width={28} height={28} className="shrink-0" />
      <span className="text-[17px] font-black tracking-tight text-gray-950 leading-none" style={{ letterSpacing: '-0.02em' }}>
        StrideWork
      </span>
    </span>
  )
}
