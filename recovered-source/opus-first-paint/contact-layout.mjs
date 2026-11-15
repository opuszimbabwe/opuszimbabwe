const cardsMarker=',(0,a.jsx)("section",{className:"border-b border-[#eeeeee] py-16",children:(0,a.jsx)("div",{className:"mx-auto max-w-4xl px-6"';
const formMarker=',(0,a.jsx)("section",{className:"border-b border-[#eeeeee] py-16",children:(0,a.jsx)("div",{id:"enquiry-form"';
const supportMarker=',(0,a.jsx)("section",{className:"mx-auto max-w-4xl px-6 py-16"';
const emailElement='(0,a.jsxs)("a",{className:"opus-contact-email",href:(q.find(e=>/^mailto:/i.test(e.href))||{href:"mailto:support@opuszim.co.zw"}).href,children:[(0,a.jsx)((0,y.ig)("Mail"),{size:20}),(0,a.jsxs)("span",{children:[(0,a.jsx)("small",{children:"Or email us directly"}),(0,a.jsx)("strong",{children:(q.find(e=>/^mailto:/i.test(e.href))||{line:"support@opuszim.co.zw"}).line})]})]})';
export function patchContactSource(source){
 const a=source.indexOf(cardsMarker),b=source.indexOf(formMarker),c=source.indexOf(supportMarker);
 if(!(a>=0&&b>a&&c>b))return source;
 let result=source.slice(0,a)+source.slice(b,c)+source.slice(a,b)+source.slice(c);
 result=result.replace('id:"enquiry-form",className:"mx-auto max-w-2xl px-6 scroll-mt-24"','id:"enquiry-form",className:"opus-contact-form-card mx-auto max-w-3xl px-6 scroll-mt-24"');
 const fields='(0,a.jsxs)("div",{className:"mt-8 space-y-4",children:';
 if(result.split(fields).length!==2)return source;
 result=result.replace(fields,emailElement+','+fields);
 const whatsApp='(0,a.jsx)("a",{href:"https://wa.me/263710740387?text=".concat(T)';
 const submit='(0,a.jsx)("button",{type:"button",className:"opus-send-enquiry",onClick:e=>document.dispatchEvent(new CustomEvent("opus-submit-enquiry",{detail:{name:n,email:s,phone:o,service:h,message:v,domain:N?b:"",button:e.currentTarget}})),children:"Send enquiry"}),(0,a.jsx)("div",{className:"opus-enquiry-status",role:"status","aria-live":"polite"}),';
 if(result.split(whatsApp).length!==2)return source;
 result=result.replace(whatsApp,submit+whatsApp);
 return result.replace('Fill in the form below and click Send. It will open WhatsApp with your details already written — you just tap send from there.','Send your enquiry directly to our team here, or continue the conversation on WhatsApp.');
}
const emailHTML='<a class="opus-contact-email" href="mailto:support@opuszim.co.zw"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg><span><small>Or email us directly</small><strong>support@opuszim.co.zw</strong></span></a>';
export function patchContactHTML(html){
 const start=html.indexOf('<main>'),end=html.indexOf('</main>',start);if(start<0||end<0)return html;
 let main=html.slice(start,end);
 const sections=[...main.matchAll(/<section class="border-b border-\[#eeeeee\] py-16">[\s\S]*?<\/section>/g)];
 if(sections.length!==2||!sections[1][0].includes('id="enquiry-form"'))return html;
 const first=sections[0],second=sections[1];
 main=main.slice(0,first.index)+second[0]+main.slice(first.index+first[0].length,second.index)+first[0]+main.slice(second.index+second[0].length);
 main=main.replace('id="enquiry-form" class="mx-auto max-w-2xl px-6 scroll-mt-24"','id="enquiry-form" class="opus-contact-form-card mx-auto max-w-3xl px-6 scroll-mt-24"');
 main=main.replace('<div class="mt-8 space-y-4">',emailHTML+'<div class="mt-8 space-y-4">');
 main=main.replace('<a href="https://wa.me/263710740387?text=','<button type="button" class="opus-send-enquiry">Send enquiry</button><div class="opus-enquiry-status" role="status" aria-live="polite"></div><a href="https://wa.me/263710740387?text=');
 main=main.replace('Fill in the form below and click Send. It will open WhatsApp with your details already written — you just tap send from there.','Send your enquiry directly to our team here, or continue the conversation on WhatsApp.');
 return html.slice(0,start)+main+html.slice(end);
}
