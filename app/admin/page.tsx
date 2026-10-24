import Link from 'next/link';
export const metadata = { title: 'Secure administration — Opus Zimbabwe', robots: { index: false, follow: false } };

// No dashboard markup in this exported alias, even if served outside Pages.
// The Pages middleware redirects every /admin variant before serving assets.
export default function AdminAlias() {
  return <main className="p-8"><Link href="/sysadmin/">Continue to secure administration</Link></main>;
}
