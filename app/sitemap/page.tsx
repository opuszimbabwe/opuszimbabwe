import Link from 'next/link';

const groups = [
  {
    title: 'Home',
    links: [['Home', '/']],
  },
  {
    title: 'Services',
    links: [
      ['Services', '/services'],
      ['Website Design & Development', '/services/web-design'],
      ['Software & Systems', '/services/software-development'],
      ['AI & Automation', '/services/ai-automation'],
      ['Graphic Design & Branding', '/services/graphic-design'],
      ['Domain & Hosting', '/services/domains-hosting'],
      ['API & Integrations', '/services/api-integrations'],
    ],
  },
  {
    title: 'Company & Resources',
    links: [
      ['Domains', '/domains'],
      ['Projects', '/projects'],
      ['FAQ', '/faq'],
      ['Contact / Start a Project', '/contact'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms & Conditions', '/terms'],
    ],
  },
  {
    title: 'Technical & System Pages',
    links: [
      ['HTML Sitemap', '/sitemap'],
      ['XML Sitemap', '/sitemap.xml'],
      ['Robots File', '/robots.txt'],
    ],
  },
];

export const metadata = {
  title: 'Sitemap — Opus Zimbabwe',
  description: 'Public website sitemap for Opus Zimbabwe.',
  robots: { index: true, follow: true },
};

export default function SitemapPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="text-center">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">Opus Zimbabwe</p>
        <h1 className="mt-3 text-4xl font-bold text-dark md:text-5xl">Public Website Sitemap</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-fg">A complete guide to the public Opus Zimbabwe website.</p>
      </header>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="border-b border-[#e5e7eb] pb-3 text-xl font-bold text-dark">{group.title}</h2>
            <ul className="mt-3 divide-y divide-[#eeeeee]">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="flex items-center justify-between py-3 text-[.95rem] text-fg transition-colors hover:text-primary">
                    <span>{label}</span>
                    <code className="text-[.78rem] text-muted-fg">{href}</code>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mx-auto mt-14 max-w-3xl text-center text-[.85rem] leading-6 text-muted-fg">
        Individual project pages can be added under Projects when they become available. Error and maintenance pages are not included in the public navigation or search sitemap.
      </p>
    </main>
  );
}
