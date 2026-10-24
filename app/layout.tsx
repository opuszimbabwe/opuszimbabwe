import './globals.css';
import localFont from 'next/font/local';
import SiteContentBoundary from '@/components/SiteContentBoundary';

const poppins = localFont({
  src: [
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: '../node_modules/@fontsource/poppins/files/poppins-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'block',
});
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrandHeadSync from '@/components/BrandHeadSync';

export const metadata = {
  title: 'Opus Zimbabwe — Digital Services for Zimbabwe',
  description: 'Websites, software systems, AI automation, branding, domains, hosting and integrations for Zimbabwean organisations',
  icons: {
    icon: '/api/favicon',
    apple: '/images/logo-full.png',
    shortcut: '/api/favicon',
  },
  // Served by the Pages Function /api/manifest so the admin-set icon applies
  // without a rebuild (falls back to the built-in icon if it is unreachable).
  manifest: '/api/manifest',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins bg-[#f8f8f6] text-[#0d0d0d]">
        <SiteContentBoundary>
        <BrandHeadSync />
        <Navbar />
        {children}
        <Footer />
        </SiteContentBoundary>
      </body>
    </html>
  );
}
