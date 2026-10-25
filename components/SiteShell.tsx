'use client';
import { usePathname } from 'next/navigation';
import SiteContentBoundary from './SiteContentBoundary';
import Navbar from './Navbar';
import Footer from './Footer';
import BrandHeadSync from './BrandHeadSync';
export default function SiteShell({ children }: { children: React.ReactNode }) {
 const path=usePathname();
 const payments = path.startsWith('/payments');
 const admin=/^\/(?:sysadmin|admin)(?:\/|$)/.test(path);
 // Financial status has its own fresh verification flow. A marketing content
 // outage must not hide a customer's checkout or payment confirmation.
 if (payments) return <><BrandHeadSync />{children}</>;
 if(admin)return <SiteContentBoundary><BrandHeadSync />{children}</SiteContentBoundary>;
 return <SiteContentBoundary><BrandHeadSync /><Navbar />{children}<Footer /></SiteContentBoundary>;
}
