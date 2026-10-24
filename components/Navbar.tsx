'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, House, Layers, Globe, BriefcaseBusiness, CircleHelp, Mail, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_SETTINGS } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const fallbackServices = [
  ['Website Design & Development', '/services/web-design/'],
  ['Software & Systems', '/services/software-development/'],
  ['AI & Automation', '/services/ai-automation/'],
  ['Graphic Design & Branding', '/services/graphic-design/'],
  ['Domain & Hosting', '/services/domains-hosting/'],
  ['API & Integrations', '/services/api-integrations/'],
];

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: (p: string) => boolean;
};

const navItems: NavItem[] = [
  { label: 'Home', icon: House, href: '/' },
  { label: 'Services', icon: Layers, href: '/services/', match: (p: string) => p.startsWith('/services') },
  { label: 'Domains', icon: Globe, href: '/domains/' },
  { label: 'Projects', icon: BriefcaseBusiness, href: '/projects/' },
  { label: 'FAQ', icon: CircleHelp, href: '/faq/' },
  { label: 'Contact', icon: Mail, href: '/contact/' },
];

function cleanPath(path: string) {
  return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { content } = useSiteContent();
  const logo = content?.settings?.navbar_logo || DEFAULT_SETTINGS.navbar_logo;
  const services = content ? content.services.filter(service => service.visible).map(service => [service.name, `/services/${service.slug}/`]) : fallbackServices;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (item: NavItem) => {
    const current = cleanPath(pathname || '/');
    if (item.match) return item.match(current);
    return current === cleanPath(item.href);
  };

  return (
    <header
      data-scrolled={scrolled}
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        scrolled
          ? 'py-3 bg-transparent shadow-none pointer-events-none'
          : 'py-4 bg-white shadow-[0_2px_6px_rgba(13,13,13,0.06)]'
      }`}
    >
      <div className="site-frame flex items-center justify-between">
        {/* Left: Transparent Opus Logo (visible at top of page, smoothly collapses on scroll) */}
        <div
          className={`flex items-center transition-all duration-300 ease-out ${
            scrolled
              ? 'w-0 opacity-0 -translate-y-2 overflow-hidden pointer-events-none'
              : 'lg:w-[170px] opacity-100 translate-y-0 pointer-events-auto'
          }`}
        >
          <Link href="/" aria-label="Opus Zimbabwe home" className="flex-shrink-0 flex items-center">
            <Image
              src={logo}
              alt="Opus Zimbabwe"
              width={144}
              height={48}
              className="h-10 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </Link>
        </div>

        {/* Centre: Navigation links — plain centred row at top, morphs into floating pill on scroll */}
        <div className="hidden lg:flex flex-1 justify-center pointer-events-auto">
          <nav
            aria-label="Primary"
            className={`flex items-center transition-all duration-300 ease-out rounded-full ${
              scrolled
                ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_6px_rgba(13,13,13,0.06)] border border-black/[0.06] px-3 py-2 gap-1'
                : 'bg-transparent shadow-none border border-transparent px-2 py-1.5 gap-1'
            }`}
          >
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const linkCls = `inline-flex items-center gap-2 rounded-full px-3 py-2 text-[14px] transition-colors duration-200 ${
                active
                  ? 'bg-white shadow-sm font-bold text-[#0d0d0d]'
                  : 'font-semibold text-[#0d0d0d]/70 hover:text-[#E85D2A]'
              }`;

              return (
                <div key={item.href} className="flex items-center">
                  {item.label === 'Services' ? (
                    <div className="relative group">
                      <Link className={linkCls} href={item.href} aria-current={active ? 'page' : undefined}>
                        {active && <Icon size={16} aria-hidden="true" />}
                        {item.label}
                      </Link>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block group-focus-within:block pt-3 w-72 z-50">
                        <div className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,.12)] border border-[#eeeeee] p-3 grid gap-1">
                          {services.map(([label, href]) => (
                            <Link
                              key={href}
                              href={href}
                              className="rounded-xl px-3 py-2.5 text-sm text-[#0d0d0d] hover:bg-[#fff8f4] hover:text-[#E85D2A] transition-colors"
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link className={linkCls} href={item.href} aria-current={active ? 'page' : undefined}>
                      {active && <Icon size={16} aria-hidden="true" />}
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right: "Get Started" CTA button (visible at top of page, smoothly collapses on scroll) */}
        <div
          className={`hidden lg:flex items-center justify-end transition-all duration-300 ease-out ${
            scrolled
              ? 'w-0 opacity-0 -translate-y-2 overflow-hidden pointer-events-none'
              : 'w-[170px] opacity-100 translate-y-0 pointer-events-auto'
          }`}
        >
          <Link
            href="/contact/"
            className="get-started-gradient hover:brightness-110 text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden flex items-center pointer-events-auto">
          <button
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="text-[#0d0d0d] p-2 rounded-full bg-white/80 backdrop-blur-sm"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-[68px] z-[60] bg-white border-t border-[#e5e7eb] overflow-y-auto pointer-events-auto">
          <nav className="flex flex-col gap-0 px-8 py-6 text-[1.05rem] font-semibold text-[#0d0d0d]">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              if (item.label === 'Services') {
                return (
                  <div key={item.href} className="border-b border-[#e5e7eb]">
                    <button
                      onClick={() => setServicesOpen(!servicesOpen)}
                      aria-expanded={servicesOpen}
                      className={`w-full flex justify-between items-center px-4 py-4 ${active ? 'rounded-full bg-white shadow-sm font-bold' : 'font-semibold'}`}
                    >
                      <span className="flex items-center gap-2">{active && <Icon size={18} aria-hidden="true" />}Services</span>
                      <span className="text-[#E85D2A] text-xl leading-none">{servicesOpen ? '−' : '+'}</span>
                    </button>
                    {servicesOpen && (
                      <div className="mb-4 ml-4 pl-4 grid gap-4 text-[.95rem] font-medium text-[#0d0d0d]/70">
                        {services.map(([label, href]) => (
                          <Link key={href} onClick={() => setOpen(false)} href={href}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  onClick={() => setOpen(false)}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`py-4 border-b border-[#e5e7eb] flex items-center gap-2 ${
                    active ? 'rounded-full bg-white px-4 text-[#0d0d0d] font-bold shadow-sm' : 'text-[#0d0d0d]/80'
                  }`}
                >
                  {active && <Icon size={18} aria-hidden="true" />}
                  {item.label}
                </Link>
              );
            })}
            <Link
              onClick={() => setOpen(false)}
              href="/contact/"
              className="get-started-gradient mt-6 text-white rounded-full px-5 py-3.5 text-center font-semibold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
