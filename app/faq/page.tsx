import FaqAccordion from '@/components/FaqAccordion';

// Built-in copy; the admin-managed "FAQ page" list renders when the content
// API is reachable (FAQ tab in /admin).
const items = [
  ['How much does a website cost?', 'Starter websites begin at $30. Standard packages start at $60. Business packages start at $100. Pricing depends on the number of pages, features and complexity required. Custom projects are quoted after a brief consultation — no obligation to proceed.'],
  ['How long does a project take?', 'Starter websites are typically delivered in 3 to 7 working days. Standard builds take 1 to 2 weeks. Business and Professional packages take 2 to 4 weeks. Software systems and custom projects are scoped individually. We confirm a timeline before any work begins.'],
  ['Do you handle domains, hosting and business email?', 'Yes. We register domains across all major extensions including .co.zw, .com, .org and others. We also set up web hosting, SSL certificates and professional business email. Everything is configured correctly from the start.'],
  ['What happens after my project is delivered?', 'Every project includes a handover and a period of post-launch support. Ongoing maintenance, updates and technical support are available from $10 per month. You will never be left managing a website or system alone.'],
  ['My project does not fit a package — can you still help?', 'Yes. If your requirements are more specific or complex than our packages cover, contact us and we will scope and quote a custom solution for you directly.'],
  ['How do I pay for a project?', 'We accept EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT. No foreign currency is required. Payment schedules for larger projects are agreed upfront.'],
  ['Do you work with small businesses and startups?', 'Yes — this is exactly who we are built for. We work with individuals, small businesses, NGOs, schools and churches that need professional digital work at a price that makes sense for where they are right now.'],
  ['What is OpusEdu?', 'OpusEdu is our dedicated school management platform, purpose-built for Zimbabwean schools. It covers admissions, fees, timetables, results and communication in one system.'],
];

export default function FAQ() {
  return (
    <main id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-[.8rem] font-semibold uppercase tracking-[.12em] text-primary">FAQ</p>
      <h1 className="mb-10 mt-3 text-4xl font-bold text-dark">Questions, answered.</h1>
      <FaqAccordion list="page" items={items.map(([q, a]) => ({ q, a }))} />
    </main>
  );
}
