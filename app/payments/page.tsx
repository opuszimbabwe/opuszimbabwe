import PaymentCheckout from '@/components/PaymentCheckout';
export const metadata = {
 title: 'Opus Pay | Secure Payments',
 description: 'Pay Opus Zimbabwe securely by card or mobile wallet.',
 robots: { index: false, follow: false },
 openGraph: {title:'Opus Pay | Secure Payments',description:'Pay Opus Zimbabwe securely by card or mobile wallet.',url:'https://payments.opuszim.co.zw/',siteName:'Opus Pay',type:'website',images:[{url:'https://payments.opuszim.co.zw/images/opus-pay/social-preview.png',width:1200,height:630,alt:'Opus Pay by Opus Zimbabwe'}]},
 twitter:{card:'summary_large_image',title:'Opus Pay | Secure Payments',images:['https://payments.opuszim.co.zw/images/opus-pay/social-preview.png']}
};
export default function Payments() { return <PaymentCheckout />; }
