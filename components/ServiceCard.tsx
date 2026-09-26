import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type ServiceCardProps = {
  gradient: string
  title: string
  icon: any
  heading: string
  description: string
  ctaText: string
  ctaHref: string
  image: string
}

export default function ServiceCard({
  gradient,
  title,
  icon,
  heading,
  description,
  ctaText,
  ctaHref,
  image,
}: ServiceCardProps) {
  const Icon = icon
  const isOrangeGradient = gradient.includes('#E85D2A') || gradient.includes('E85D2A')

  return (
    <article className="group relative isolate overflow-hidden rounded-[40px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(0,0,0,0.13)]">
      <div className="absolute inset-x-0 top-0 h-[350px] overflow-hidden rounded-[40px] bg-[#e9e9e9]">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/55" />
        <span className={`absolute left-6 top-6 rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-[.65rem] font-bold uppercase tracking-[.12em] text-dark shadow-sm backdrop-blur-sm ${isOrangeGradient ? 'ring-1 ring-[#E85D2A]/20' : ''}`}>
          {title}
        </span>
      </div>

      <div className="relative mt-[290px] min-h-[260px] rounded-tr-[55px] bg-white px-6 pb-7 pt-[76px] sm:px-7">
        <div className="svc-avatar-ring" aria-hidden="true">
          <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#111111] text-white shadow-inner">
            <Icon size={34} strokeWidth={1.7} />
          </span>
        </div>

        <h3 className="text-[1.3rem] font-bold leading-tight tracking-tight text-dark">
          {heading}
        </h3>
        <p className="mt-3 min-h-[7.5rem] text-[.9rem] leading-[1.7] text-[#6b7280]">
          {description}
        </p>

        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[.85rem] font-semibold text-white shadow-[0_4px_12px_rgba(232,93,42,0.25)] transition-all duration-200 hover:brightness-[1.06] hover:shadow-[0_6px_16px_rgba(232,93,42,0.35)]"
          style={{ background: 'linear-gradient(90deg,#E85D2A 0%,#F97316 50%,#F4A226 100%)' }}
        >
          {ctaText}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}
