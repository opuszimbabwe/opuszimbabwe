'use client';
import { usePathname } from 'next/navigation';
import SiteContentBoundary from './SiteContentBoundary';
import Navbar from './Navbar';
import Footer from './Footer';
import BrandHeadSync from './BrandHeadSync';
export default function SiteShell({ children }: { children: React.ReactNode }) {
 const payments = usePathname().startsWith('/payments');
 // Financial status has its own fresh verification flow. A marketing content
 // outage must not hide a customer's checkout or payment confirmation.
 if (payments) return <><BrandHeadSync />{children}</>;
 return <SiteContentBoundary><BrandHeadSync /><Navbar />{children}<Footer /></SiteContentBoundary>;
}
