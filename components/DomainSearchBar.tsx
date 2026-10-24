'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { contactHref } from '@/lib/content';

const SERVICE = 'Domain Registration & Web Hosting';
// A registration enquiry must identify a full domain, rather than a search word.
const DOMAIN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export default function DomainSearchBar() {
  const [q, setQ] = useState('');
  const [requested, setRequested] = useState('');
  const [error, setError] = useState('');
  return <div className="max-w-2xl">
    <form onSubmit={event => {
      event.preventDefault();
      const domain = q.trim().toLowerCase();
      if (!DOMAIN.test(domain)) {
        setRequested('');
        setError('Enter a full domain name, for example yourbusiness.co.zw or yourbusiness.com.');
        return;
      }
      setError(''); setRequested(domain);
    }} className="flex items-center overflow-hidden rounded-full bg-white p-1.5 shadow-xl">
      <Search className="ml-4 shrink-0 text-muted-fg" size={20} aria-hidden="true" />
      <label htmlFor="domain-search" className="sr-only">Domain name</label>
      <input id="domain-search" value={q} onChange={event => { setQ(event.target.value); setRequested(''); setError(''); }} placeholder="yourbusiness.co.zw" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'domain-search-error' : 'domain-search-help'} className="min-w-0 flex-1 bg-transparent px-3 py-3 font-semibold outline-none placeholder:font-normal" />
      <button type="submit" className="shrink-0 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white">Check domain</button>
    </form>
    <p id="domain-search-help" className="mt-3 text-sm leading-6 text-muted-fg">Our team confirms availability and pricing before registration.</p>
    {error && <p id="domain-search-error" role="alert" className="mt-3 text-sm leading-6 text-red-700">{error}</p>}
    <div role="status" aria-live="polite">{requested && <div className="mt-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 text-sm leading-6 text-dark"><p>Request an availability check for <strong>{requested}</strong>.</p><Link href={contactHref(SERVICE, requested)} className="mt-2 inline-flex font-semibold text-primary hover:underline">Ask us about this domain →</Link></div>}</div>
  </div>;
}
