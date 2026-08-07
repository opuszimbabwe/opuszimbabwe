'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Home, Briefcase, HelpCircle, Globe } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const services = [
  ['Website Design & Development', '/services/web-design'],
  ['Software & Systems', '/services/software-development'],
  ['AI & Automation', '/services/ai-automation'],
  ['Graphic Design & Branding', '/services/graphic-design'],
  ['Domain & Hosting', '/services/domains-hosting'],
  ['API & Integrations', '/services/api-integrations'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const active = (href: string) => pathname === href
  const pill = 'bg-white rounded-full px-3.5 py-1.5 shadow-sm font-bold flex items-center gap-1'
  const plain = 'px-3 py-1.5 text-muted-fg font-medium'

  return <header className="sticky top-0 z-50 px-5 py-3 bg-white md:bg-white/85 backdrop-blur-md">
    <div className="bg-gray-100 rounded-full px-1.5 py-1.5 flex items-center justify-between gap-3 max-w-7xl mx-auto">
      <Link href="/" aria-label="Opus Zimbabwe home" className="flex items-center"><Image src="/images/logo.png" alt="Opus Zimbabwe icon" width={36} height={36} className="h-9 w-9 rounded-full" /></Link>
      <nav className="hidden md:flex items-center gap-1 text-sm">
        <Link className={active('/') ? pill : plain} href="/">{active('/') && <Home size={14} />}Home</Link>
        <div className="relative group">
          <Link className={pathname.startsWith('/services') ? pill : plain} href="/services">{pathname.startsWith('/services') && <Briefcase size={14} />}Services</Link>
          <div className="absolute left-1/2 top-full hidden -translate-x-1/2 group-hover:block pt-3 w-72">
            <div className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,.12)] border border-border p-3 grid gap-1">
              {services.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-fg hover:bg-muted hover:text-primary">{label}</Link>)}
            </div>
          </div>
        </div>
        <Link className={active('/faq') ? pill : plain} href="/faq">{active('/faq') && <HelpCircle size={14} />}FAQ</Link>
        <Link className={active('/domains') ? pill : plain} href="/domains">{active('/domains') && <Globe size={14} />}Domains</Link>
      </nav>
      <div className="hidden md:flex items-center gap-4"><Link href="/contact" className="text-primary font-semibold text-sm">Get a Quote</Link><Link href="/contact" className="bg-dark text-white rounded-full px-5 py-2.5 text-sm font-semibold">Start a Project</Link></div>
      <button aria-label="Toggle navigation menu" aria-expanded={open} className="md:hidden text-dark" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <div className="md:hidden fixed inset-0 top-[68px] bg-white p-8"><nav className="flex flex-col gap-6 text-lg font-semibold"><Link onClick={() => setOpen(false)} href="/">Home</Link><Link onClick={() => setOpen(false)} href="/services">Services</Link><Link onClick={() => setOpen(false)} href="/domains">Domains</Link><Link onClick={() => setOpen(false)} href="/faq">FAQ</Link><Link onClick={() => setOpen(false)} className="bg-dark text-white rounded-full px-5 py-3 text-center" href="/contact">Start a Project</Link></nav></div>}
  </header>
}