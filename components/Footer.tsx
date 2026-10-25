'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useSiteContent } from '@/lib/use-site-content'
import { DEFAULT_SETTINGS } from '@/lib/content'
import FooterSocials from '@/components/FooterSocials'

const fallbackServices=[
  ['Website Design & Development','/services/web-design'],
  ['Software & Systems','/services/software-development'],
  ['AI & Automation','/services/ai-automation'],
  ['Graphic Design & Branding','/services/graphic-design'],
  ['Domain & Hosting','/services/domains-hosting'],
  ['API & Integrations','/services/api-integrations']
]

export default function Footer(){
  const { content } = useSiteContent()
  const services = content ? content.services.filter(service => service.visible).map(service => [service.name, `/services/${service.slug}/`]) : fallbackServices
  const logo = content?.settings.navbar_logo || DEFAULT_SETTINGS.navbar_logo
  return (
    <footer id="footer" className="bg-[#f5f5f5] text-dark">
      <div className="footer-divider h-px w-full bg-[#e5e7eb]" aria-hidden="true"/>
      <div className="site-frame py-14">
        <FooterSocials/>

        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-bold text-dark text-sm uppercase tracking-wider mb-4">Services</h3>
            {services.map(([x,h])=><Link key={h} className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href={h}>{x}</Link>)}
          </div>
          <div>
            <h3 className="font-bold text-dark text-sm uppercase tracking-wider mb-4">Company</h3>
            <Link className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="/projects">Projects</Link>
            <Link className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="/faq">FAQ</Link>
            <Link className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="/domains">Domain Registration</Link>
            <Link className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="/care/">Monthly Project Care</Link>
            <Link className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="/contact">Contact Us</Link>
            <a className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors" href="https://payments.opuszim.co.zw/">Make a Payment</a>
          </div>
          <div>
            <h3 className="font-bold text-dark text-sm uppercase tracking-wider mb-4">Get In Touch</h3>
            <a href="https://wa.me/263710740387" target="_blank" rel="noreferrer" className="block text-[#6b7280] text-sm mt-3 hover:text-primary transition-colors">Direct / WhatsApp: 0710 740 387</a>
            <a href="tel:+263773979162" className="block text-[#6b7280] text-sm mt-2 hover:text-primary transition-colors">Support only: 0773 979 162</a>
            <a href="mailto:support@opuszim.co.zw" className="block text-[#6b7280] text-sm mt-2 hover:text-primary transition-colors">support@opuszim.co.zw</a>
            <a href="mailto:opuszimbabwe@outlook.com" className="block text-[#6b7280] text-sm mt-2 hover:text-primary transition-colors">opuszimbabwe@outlook.com</a>
          </div>
        </div>

        {/* Logo centered */}
        <div className="mt-14 flex justify-center">
          <Image src={logo} alt="Opus Zimbabwe" width={520} height={347} className="w-[min(420px,80vw)] h-auto object-contain opacity-90" />
        </div>

        {/* REQUIRED: centre aligned as per request */}
        <p className="text-center text-dark/50 text-[13.5px] mt-6 max-w-2xl mx-auto leading-6 px-4">
          Opus Zimbabwe delivers professional digital services for businesses, NGOs, schools and organisations across Zimbabwe.
        </p>

        <div className="mt-10 pt-5 border-t border-dark/10 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[#6b7280]">
          <span>© 2026 Opus Zimbabwe. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-dark/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-dark/60 transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
