// WhatsApp has no Markdown tables or site-relative navigation. Keep this
// channel adaptation out of the website assistant's rich response format.
function link(value:string):string{
 try{const url=new URL(value,'https://opuszim.co.zw');if(url.protocol!=='https:'||url.username||url.password)return '';if(value.startsWith('/')&&url.origin!=='https://opuszim.co.zw')return '';return url.href;}catch{return '';}
}
export function whatsappText(input:string,max=2800):string{
 let text=input.replace(/\r\n?/g,'\n')
 .replace(/\[OPEN:([^|\]]+)\|([^\]]+)\]/g,(_,path:string,label:string)=>{const url=link(path);return url?label+': '+url:label;})
 .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(_,label:string,path:string)=>{const url=link(path);return url?label+': '+url:label;});
 const lines=text.split('\n'),out:string[]=[];
 for(let i=0;i<lines.length;i++){
  const row=lines[i].trim();
  if(row.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
   const cells=(s:string)=>s.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
   const headers=cells(row);i++;
   while(i+1<lines.length&&lines[i+1].includes('|')){const values=cells(lines[++i]);if(values.every(v=>/^:?-+:?$/.test(v)))continue;out.push('- '+values.map((v,n)=>n&&headers[n]?headers[n]+': '+v:v).filter(Boolean).join(' — '));}
  }else out.push(lines[i]);
 }
 text=out.join('\n').replace(/^\s*#{1,6}\s+/gm,'').replace(/\*\*([^*\n]+)\*\*/g,'$1').replace(/__([^_\n]+)__/g,'$1').replace(/`([^`\n]+)`/g,'$1').replace(/^\s*```[^\n]*$/gm,'')
 .replace(/(^|[\s(])\/(?!\/)([a-zA-Z0-9][a-zA-Z0-9/_?=&%#.-]*)/g,(_,prefix:string,path:string)=>prefix+link('/'+path))
 .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 if(text.length>max)text=text.slice(0,Math.max(0,max-1)).replace(/\S*$/,'').trimEnd()+'…';
 return text;
}
