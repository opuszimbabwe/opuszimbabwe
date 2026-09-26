import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Use system font stack to avoid Google Fonts network fetch during build
// Poppins is still referenced via CSS variable for styling
const poppins = { variable: '--font-poppins' } as any;

export const metadata = {
  title: 'Opus Zimbabwe — Digital Services for Zimbabwe',
  description: 'Websites, software systems, AI automation, branding, domains, hosting and integrations for Zimbabwean organisations',
  icons: {
    icon: [
      { url: '/images/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/images/logo.png',
    shortcut: '/images/favicon-96x96.png',
  },
  manifest: '/manifest.json',
};

export default function Layout({children}:{children:React.ReactNode}){
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins">
        <Navbar/>
        {children}
        <Footer/>
      </body>
    </html>
  )
}
