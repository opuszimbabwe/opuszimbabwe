'use client';
// Domain search box on /domains.
// Availability is still mocked (see MOCK_BACKEND), but the call to action now
// hands the searched name to the enquiry form: /contact?service=…&domain=…

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { contactHref } from '@/lib/content';

const SERVICE = 'Domain Registration & Web Hosting';

export default function DomainSearchBar() {
  const [q, setQ] = useState('');
  const [done, setDone] = useState(false);
  const value = q.trim() || 'yourdomain';

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
        className="flex items-center overflow-hidden rounded-full bg-white/90 p-1.5 shadow-xl"
      >
        <Search className="ml-4 text-muted-fg" size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your domain"
          className="flex-1 bg-transparent px-3 py-3 font-semibold outline-none placeholder:font-semibold"
        />
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Search Domain</button>
      </form>
      {done && (
        <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-dark">
          {/* MOCK_BACKEND: replace with live Cloudflare availability check */}
          <b>{value}</b> is available in this demo.
          <Link
            href={contactHref(SERVICE, value)}
            className="ml-2 font-semibold text-primary hover:underline"
          >
            Register it →
          </Link>
        </div>
      )}
    </div>
  );
}
