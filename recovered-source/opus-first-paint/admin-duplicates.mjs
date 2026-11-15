// Apply only to the audited published client. The settings object and save APIs are untouched.
export const duplicatePartnerFields='(0,s.jsx)(ad,{label:"Heading",value:aw.partners_heading,onChange:e=>e2({partners_heading:e})}),(0,s.jsx)(ad,{label:"Optional Subheading",value:aw.partners_subheading,onChange:e=>e2({partners_subheading:e}),placeholder:"Leave blank for heading only"})';
export const canonicalPartnerShortcut='(0,s.jsxs)("div",{className:"rounded-2xl border bg-white p-4 text-sm",children:[(0,s.jsx)("p",{className:"mb-3 text-sm text-black/60",children:"Partner headings and logos are managed together in Trusted Partners."}),(0,s.jsx)("button",{type:"button",onClick:()=>ej("partners"),className:"rounded-full bg-[#E85D2A] px-5 py-2 text-sm font-semibold text-white",children:"Open Trusted Partners editor"})]})';
export function patchAdminDuplicateControls(source){
 if(!source.includes('let[ev,ej]=(0,i.useState)("home")')||source.split(duplicatePartnerFields).length!==2||!source.includes('children:"3. Partners Section"}),'+duplicatePartnerFields))return source;
 return source.replace(duplicatePartnerFields,canonicalPartnerShortcut);
}
export function isAdminClient(path){return /^\/_next\/static\/chunks\/app\/sysadmin\/page-[a-f0-9]+\.js$/.test(path);}
export function versionAdminElement(element,origin){const attr=element.tagName==='script'?'src':'href',value=element.getAttribute(attr);if(!value)return;try{const asset=new URL(value,origin);if(asset.origin===new URL(origin).origin&&isAdminClient(asset.pathname)){asset.searchParams.set('opus-admin','inbox-20261114-2');element.setAttribute(attr,asset.pathname+asset.search);}}catch{}}
export const legacyConversationGroup='{group:"Customer Conversations",items:[{id:"webchat",label:"Website Inbox",icon:b.Z,badge:O||void 0},{id:"feedback",label:"Website Feedback",icon:b.Z},{id:"whatsapp",label:"WhatsApp Inbox",icon:eA,badge:I||void 0}]},';
export function patchAdminConversationNav(source){
 const footer='className:"admin-sidebar-footer",children:[',hook='return(0,i.useEffect)(()=>{let e=!0,t=()=>{document.hidden||fetch("/api/admin/whatsapp?summary=1"';
 if(source.split(legacyConversationGroup).length!==2||source.split(footer).length!==2||source.split(hook).length!==2)return source;
 return source.replace(legacyConversationGroup,'').replace(footer,footer+'(0,s.jsx)("a",{href:"/sysadmin/mobile/",className:"rounded-full bg-[#E85D2A] px-5 py-2 text-sm font-semibold text-white",children:"Open Inbox app"}),').replace(hook,'return(0,i.useEffect)(()=>{if(!["whatsapp","webchat"].includes(new URLSearchParams(location.search).get("tool")))return;let e=!0,t=()=>{document.hidden||fetch("/api/admin/whatsapp?summary=1"');
}
