'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const services = [
  ['Website Design & Development', '/services/web-design'],
  ['Software & Systems',           '/services/software-development'],
  ['AI & Automation',              '/services/ai-automation'],
  ['Graphic Design & Branding',    '/services/graphic-design'],
  ['Domain & Hosting',             '/services/domains-hosting'],
  ['API & Integrations',           '/services/api-integrations'],
]

export default function Navbar() {
  const [open, setOpen]               = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const pathname                      = usePathname()
  const active = (href: string)       => pathname === href
  const pill  = 'bg-white rounded-full px-4 py-1.5 shadow-sm font-bold text-dark text-sm'
  const plain = 'px-3 py-1.5 text-[#6b7280] font-medium text-sm hover:text-dark transition-colors'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#f0f0f0] md:bg-white/90 md:backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-4">
        <Link href="/" aria-label="Opus Zimbabwe home" className="flex-shrink-0 flex items-center">
          <Image src="/images/logo.png" alt="Opus Zimbabwe" width={40} height={40} className="h-10 w-auto object-contain" style={{ background: 'transparent' }} />
        </Link>
        <div className="hidden md:flex flex-1 items-center justify-between bg-gray-100 rounded-full px-2 py-1.5">
          <nav className="flex items-center gap-1">
            <Link className={active('/') ? pill : plain} href="/">Home</Link>
            <div className="relative group"><Link className={pathname.startsWith('/services') ? pill : plain} href="/services">Services</Link><div className="absolute left-0 top-full hidden group-hover:block pt-3 w-72 z-50"><div className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,.12)] border border-[#eeeeee] p-3 grid gap-1">{services.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-[#454545] hover:bg-[#f5f5f5] hover:text-primary">{label}</Link>)}</div></div></div>
            <Link className={active('/domains') ? pill : plain} href="/domains">Domains</Link>
            <Link className={active('/projects') ? pill : plain} href="/projects">Projects</Link>
            <Link className={active('/faq') ? pill : plain} href="/faq">FAQ</Link>
            <Link className={active('/contact') ? pill : plain} href="/contact">Contact</Link>
          </nav>
          <Link href="/contact" className="bg-primary hover:bg-dark text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors">Get Started</Link>
        </div>
        <div className="md:hidden flex-1 flex justify-end"><button aria-label="Toggle navigation" aria-expanded={open} className="text-dark p-1" onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <Menu size={24} />}</button></div>
      </div>
      {open && <div className="md:hidden fixed inset-0 top-[61px] z-[60] bg-white border-t border-[#eeeeee] overflow-y-auto"><nav className="flex flex-col gap-0 px-8 py-6 text-[1.05rem] font-semibold text-dark"><Link onClick={() => setOpen(false)} href="/" className="py-4 border-b border-[#f0f0f0]">Home</Link><div className="border-b border-[#f0f0f0]"><button onClick={() => setServicesOpen(!servicesOpen)} className="w-full flex justify-between items-center py-4">Services<span className="text-primary text-xl leading-none">{servicesOpen ? '−' : '+'}</span></button>{servicesOpen && <div className="mb-4 ml-4 border-l-2 border-primary/30 pl-4 grid gap-4 text-[.95rem] font-medium text-[#6b7280]">{services.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} href={href}>{label}</Link>)}</div>}</div><Link onClick={() => setOpen(false)} href="/domains" className="py-4 border-b border-[#f0f0f0]">Domains & Hosting</Link><Link onClick={() => setOpen(false)} href="/projects" className="py-4 border-b border-[#f0f0f0]">Projects</Link><Link onClick={() => setOpen(false)} href="/faq" className="py-4 border-b border-[#f0f0f0]">FAQ</Link><Link onClick={() => setOpen(false)} href="/contact" className="py-4 border-b border-[#f0f0f0]">Contact</Link><Link onClick={() => setOpen(false)} href="/contact" className="mt-6 bg-primary text-white rounded-full px-5 py-3.5 text-center font-semibold">Get Started</Link></nav></div>}
    </header>
  )
}
