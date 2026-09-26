'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Home, LayoutDashboard, Globe, FolderKanban, HelpCircle, Mail } from 'lucide-react'
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

type NavItem = {
  label: string
  href: string
  icon: any
  match?: (p: string) => boolean
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Services', href: '/services', icon: LayoutDashboard, match: (p: string) => p.startsWith('/services') },
  { label: 'Domains', href: '/domains', icon: Globe },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'FAQ', href: '/faq', icon: HelpCircle },
  { label: 'Contact', href: '/contact', icon: Mail },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(pathname)
    return pathname === item.href
  }

  const pillClass = 'bg-white rounded-full px-4 py-1.5 shadow-sm font-bold text-dark text-[13px] flex items-center gap-1.5 transition-all'
  const plainClass = 'px-3.5 py-1.5 text-[#6b7280] font-medium text-[13px] hover:text-dark transition-colors flex items-center gap-1.5'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#f0f0f0] md:bg-white/90 md:backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" aria-label="Opus Zimbabwe home" className="flex-shrink-0 flex items-center">
          <Image src="/images/logo.png" alt="Opus Zimbabwe" width={44} height={44} className="h-10 w-auto object-contain" style={{ background: 'transparent' }} />
        </Link>

        {/* Center grey pill nav - desktop */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="bg-[#f1f1f1] rounded-full px-2 py-1.5 flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            {navItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              if (item.label === 'Services') {
                return (
                  <div key={item.href} className="relative group">
                    <Link className={active ? pillClass : plainClass} href={item.href}>
                      {active && <Icon size={15} strokeWidth={2} />}
                      {item.label}
                    </Link>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block pt-3 w-72 z-50">
                      <div className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,.12)] border border-[#eeeeee] p-3 grid gap-1">
                        {services.map(([label, href]) => (
                          <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm text-[#454545] hover:bg-[#f5f5f5] hover:text-primary transition-colors">
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <Link key={item.href} className={active ? pillClass : plainClass} href={item.href}>
                  {active && <Icon size={15} strokeWidth={2} />}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Get Started - outside grey carousel, in main navbar */}
        <div className="hidden md:flex items-center">
          <Link href="/contact" className="bg-dark hover:bg-primary text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-colors shadow-sm">
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center">
          <button aria-label="Toggle navigation" aria-expanded={open} className="text-dark p-1" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 top-[61px] z-[60] bg-white border-t border-[#eeeeee] overflow-y-auto">
          <nav className="flex flex-col gap-0 px-8 py-6 text-[1.05rem] font-semibold text-dark">
            {navItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              if (item.label === 'Services') {
                return (
                  <div key={item.href} className="border-b border-[#f0f0f0]">
                    <button onClick={() => setServicesOpen(!servicesOpen)} className="w-full flex justify-between items-center py-4">
                      <span className="flex items-center gap-2">
                        {active && <Icon size={18} />} Services
                      </span>
                      <span className="text-primary text-xl leading-none">{servicesOpen ? '−' : '+'}</span>
                    </button>
                    {servicesOpen && (
                      <div className="mb-4 ml-4 border-l-2 border-primary/30 pl-4 grid gap-4 text-[.95rem] font-medium text-[#6b7280]">
                        {services.map(([label, href]) => (
                          <Link key={href} onClick={() => setOpen(false)} href={href}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className={`py-4 border-b border-[#f0f0f0] flex items-center gap-2 ${active ? 'text-dark font-bold' : ''}`}
                >
                  {active && <Icon size={18} />}
                  {item.label}
                </Link>
              )
            })}
            <Link onClick={() => setOpen(false)} href="/contact" className="mt-6 bg-dark text-white rounded-full px-5 py-3.5 text-center font-semibold">
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
