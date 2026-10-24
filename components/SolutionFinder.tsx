'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { staticServices } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
const questions = [
  { title: 'What would you like to improve?', choices: [ ['website', 'Our website or online presence'], ['systems', 'How we manage our operations'], ['automation', 'Repetitive work, customer responses or AI'], ['branding', 'Our brand and marketing materials'], ['domains', 'Our domain, hosting or business email'], ['integrations', 'How our existing tools work together'] ] },
  { title: 'Who are we building for?', choices: [ ['business', 'A business or entrepreneur'], ['school', 'A school or training provider'], ['organisation', 'An organisation, NGO or community group'], ['individual', 'An individual or personal project'] ] },
  { title: 'Where are you starting?', choices: [ ['new', 'We are starting something new'], ['improve', 'We want to improve what we already have'], ['unsure', 'We need help defining the right approach'] ] },
];
const recommendations: Record<string, { id: string; reason: string }> = {
  website: { id: 'web-design', reason: 'Start with a website that explains your offer clearly and gives visitors a useful next step.' },
  systems: { id: 'software-development', reason: 'Start by mapping your workflows, then scope software or a management system around how your team actually works.' },
  automation: { id: 'ai-automation', reason: 'Start with one repeatable workflow. We can assess whether automation or AI is useful, how it connects to your tools and where human review is needed.' },
  branding: { id: 'graphic-design', reason: 'Start with a consistent visual identity and the materials your audience needs to recognise and trust you.' },
  domains: { id: 'domains-hosting', reason: 'Start with your domain, hosting and professional email requirements. Availability and pricing need confirmation; Zimbabwean domains are handled through our team.' },
  integrations: { id: 'api-integrations', reason: 'Start by identifying which tools need to exchange information, then scope a reliable integration between them.' },
};
export default function SolutionFinder({ label, className = '', preview = false }: { label: string; className?: string; preview?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(['', '', '']);
  const { content } = useSiteContent();
  useEffect(() => { if (dialog.current?.open) title.current?.focus(); }, [step]);
  const question = questions[step];
  const recommendation = recommendations[answers[0]];
  const services = content ? content.services.filter(service => service.visible) : staticServices;
  const service = services.find(item => item.id === recommendation?.id);
  const brief = answers.map((answer, i) => `${questions[i].title} ${questions[i].choices.find(c => c[0] === answer)?.[1] || ''}`).join('\n');
  const contact = `/contact/?${new URLSearchParams({ service: service?.name || 'Help choosing a solution', brief }).toString()}`;
  const open = () => { setStep(0); setAnswers(['', '', '']); dialog.current?.showModal(); requestAnimationFrame(() => title.current?.focus()); };
  const close = () => dialog.current?.close();
  return <>
    <button ref={trigger} type="button" className={className} aria-haspopup="dialog" onClick={open} tabIndex={preview ? -1 : undefined}>{label}</button>
    <dialog ref={dialog} className="solution-sheet" aria-labelledby="solution-finder-title" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const root = event.currentTarget;
      const controls = Array.from(root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]')).filter(el => {
        if (el.tabIndex < 0 || !el.getClientRects().length) return false;
        if (el instanceof HTMLInputElement && el.type === 'radio') {
          const group = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(r => r.name === el.name);
          return el === (group.find(r => r.checked) || group[0]);
        }
        return true;
      });
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } }}>
      <div className="solution-sheet-header"><p className="text-xs font-semibold uppercase tracking-wider text-[#b8441c]">Find your next step with Opus</p><button type="button" onClick={close} aria-label="Close solution finder" className="rounded-full border p-3"><X size={20} /></button></div>
      <ol aria-label="Your progress" className="mb-7 grid grid-cols-4 gap-2 text-xs">{['Your goal', 'Your organisation', 'Starting point', 'Next step'].map((name, i) => <li key={name} aria-current={i === step ? 'step' : undefined} className={`border-t-[3px] pt-3 ${i <= step ? 'border-[#E85D2A] text-[#0d0d0d]' : 'border-[#e5e7eb] text-black/50'}`}>{name}</li>)}</ol>
      {step < 3 ? <>
        <h2 ref={title} tabIndex={-1} id="solution-finder-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{question.title}</h2>
        <fieldset className="mt-6 grid gap-3 sm:grid-cols-2"><legend className="sr-only">{question.title}</legend>{question.choices.map(([value, title]) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${answers[step] === value ? 'border-[#E85D2A] bg-[#fff8f4]' : 'border-black/15 bg-white'}`}><input type="radio" className="mt-1 accent-[#E85D2A]" name={`solution-step-${step}`} value={value} checked={answers[step] === value} onChange={() => setAnswers(prev => prev.map((a, i) => i === step ? value : a))} />{title}</label>)}</fieldset>
        <div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm disabled:opacity-40"><ArrowLeft size={16} />Back</button><button type="button" disabled={!answers[step]} onClick={() => setStep(s => s + 1)} className="inline-flex items-center gap-2 rounded-full bg-[#b8441c] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40">{step === 2 ? 'See my next step' : 'Continue'}<ArrowRight size={16} /></button></div>
      </> : <>
        <h2 ref={title} tabIndex={-1} id="solution-finder-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{service ? `Start with ${service.name.toLowerCase()}.` : 'Let’s scope the right solution.'}</h2>
        <p className="mt-5 text-base leading-7 text-black/70">{recommendation?.reason}</p>
        <div className="mt-6 rounded-2xl bg-[#f8fafc] p-5 text-sm leading-6">{answers[1] === 'school' ? 'For schools, we can discuss admissions, parent communication and administration.' : answers[1] === 'organisation' ? 'For organisations, we can discuss how you communicate your work and support the people you serve.' : answers[1] === 'business' ? 'For businesses, we can discuss enquiries, customer experience and the work that slows your team down.' : 'We can start with the goals and practical requirements of your project.'} {answers[2] === 'improve' ? 'Bring your current website or tools so we can assess what to keep and what to improve.' : answers[2] === 'unsure' ? 'We will help define the scope before you commit.' : 'We will discuss a clear starting scope before development.'}</div>
        <p className="mt-4 text-xs leading-5 text-black/55">This is a starting recommendation, not a quotation. Your choices are included in the enquiry; nothing has been submitted yet.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link onClick={close} href={contact} className="rounded-full bg-[#b8441c] px-6 py-3 text-sm font-semibold text-white">Discuss this with Opus</Link>{service && <Link onClick={close} href={`/services/${service.slug}/`} className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold">Explore this service</Link>}</div>
        <button type="button" onClick={() => setStep(2)} className="mt-6 inline-flex items-center gap-2 text-sm underline"><ArrowLeft size={16} />Change my answers</button>
      </>}
    </dialog>
  </>;
}
