import Link from 'next/link';
import ProjectsList from '@/components/ProjectsList';

export default function Projects() {
  return (
    <main>
      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-20">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">Our work</p>
        <h1 className="mt-3 text-4xl font-bold text-dark md:text-5xl">Live Work</h1>
        <p className="mt-4 max-w-2xl leading-7 text-fg">
          Every project listed here is live, real and built by Opus Zimbabwe. More work is delivered regularly.
        </p>
      </section>

      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-20">
        <ProjectsList />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-[28px] bg-dark p-8 text-white md:p-12">
          <h2 className="text-2xl font-bold">Want to be on this page?</h2>
          <p className="mt-3 text-white/70">Tell us what you need and we will build something worth showing off.</p>
          <div className="mt-7 flex gap-4">
            <Link href="/contact" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">
              Start a project
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white"
            >
              See our services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
