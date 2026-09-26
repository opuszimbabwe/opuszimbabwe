'use client'
// Contact page.
//
// /contact?service=…&domain=… pre-fills the enquiry form: service pages link
// here with ?service=, and domain CTAs add &domain= (empty or pre-set, e.g.
// /domains cards pass the extension the visitor clicked).
// The contact cards are admin-managed (Brand tab in /admin).

import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import FloatingInput from '@/components/FloatingInput'
import { DEFAULT_SETTINGS, staticServices } from '@/lib/content'
import { resolveIcon } from '@/lib/icons'
import { useSiteContent } from '@/lib/use-site-content'

export default function Contact() {
  const { content } = useSiteContent()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('')
  const [message, setMessage] = useState('')
  const [domain, setDomain] = useState('')
  const [domainActive, setDomainActive] = useState(false)
  const [requested, setRequested] = useState('')

  // Read the prefill parameters after mount so the exported static page
  // renders fully before the query string is applied.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const serviceParam = params.get('service')
    const domainParam = params.get('domain')
    if (serviceParam) {
      setRequested(serviceParam)
      setService(serviceParam)
    }
    if (domainParam !== null) {
      setDomainActive(true)
      setDomain(domainParam)
    }
  }, [])

  const cards = content?.settings?.contact_cards?.length
    ? content.settings.contact_cards
    : DEFAULT_SETTINGS.contact_cards

  const options = useMemo(() => {
    const services = content?.services?.length ? content.services : staticServices
    const names = services.filter((s) => s.visible).map((s) => s.name)
    const base = names.length ? names : staticServices.map((s) => s.name)
    return requested && !base.includes(requested) ? [requested, ...base] : base
  }, [content, requested])

  const lines = [
    'Hello Opus Zimbabwe,',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Service interested in: ${service}`,
  ]
  if (domainActive) lines.push(`Domain: ${domain}`)
  lines.push('', 'Message:', message)
  const waMessage = encodeURIComponent(lines.join('\n'))

  return (
    <main>
      <section className="bg-primary px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-white/70">Contact Opus Zimbabwe</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            Tell us what you need.
            <br />
            We will take it from there.
          </h1>
          <p className="mt-4 text-[1.05rem] leading-7 text-white/80">
            Most projects start with a short conversation. WhatsApp is fastest — we usually respond within the hour.
          </p>
        </div>
      </section>

      <section className="border-b border-[#eeeeee] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => {
              const Icon = resolveIcon(card.icon)
              const external = card.href.startsWith('http')
              return (
                <a
                  key={`${card.title}-${card.href}`}
                  href={card.href}
                  target={external ? '_blank' : undefined}
                  rel="noreferrer"
                  className="group flex flex-col items-center rounded-[20px] border border-[#e8e8e8] p-7 text-center hover:border-primary/40"
                >
                  <span
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                      card.title === 'WhatsApp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <Icon size={24} />
                  </span>
                  <b className="text-dark">{card.title}</b>
                  <small className="mt-1 text-[.82rem] leading-5 text-[#6b7280]">
                    {card.line}
                    <br />
                    {card.note}
                  </small>
                  <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                    {card.title === 'WhatsApp' ? 'Message us' : card.title === 'Email' ? 'Send email' : 'Call now'}
                    <ArrowRight size={13} />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#eeeeee] py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-2xl font-bold text-dark">Prefer to write it out?</h2>
          <p className="mt-2 text-center text-[.9rem] leading-6 text-[#6b7280]">
            Fill in the form below and click Send. It will open WhatsApp with your details already written — you just tap
            send from there.
          </p>
          <div className="mt-8 space-y-4">
            <FloatingInput label="Your name or organisation" value={name} onChange={(e) => setName(e.target.value)} />
            <FloatingInput label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FloatingInput
              label="WhatsApp or phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="relative">
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full appearance-none rounded-[14px] border-2 border-[#e5e7eb] bg-[#f5f5f5] px-4 py-3.5 text-[.95rem] text-dark outline-none focus:border-primary focus:bg-white"
              >
                <option value="">Service interested in</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="Not sure yet">Not sure yet</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">▾</span>
            </div>
            {domainActive && (
              <FloatingInput
                label={domain ? 'Domain wanted' : 'Domain wanted (optional)'}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            )}
            <FloatingInput
              label="Tell us what you need"
              textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <a
              href={`https://wa.me/263776396530?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 font-semibold text-white hover:bg-dark"
            >
              Send on WhatsApp
            </a>
            <p className="text-center text-[.78rem] text-[#9ca3af]">
              Opens WhatsApp with your message pre-filled. You send it from there.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Within the hour', 'WhatsApp response during business hours'],
            ['Within 1 business day', 'Email response guaranteed'],
            ['No obligation', 'First consultation is always free'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-[#e8e8e8] p-5 text-center">
              <p className="font-bold text-dark">{title}</p>
              <p className="mt-1 text-[.85rem] text-[#6b7280]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
