/** Client documents describe the service; the admin retains original source evidence. */
export function clientCareText(value:string){
 return value.replace(/https?:\/\/(?:[a-z0-9-]+\.)?(?:github\.com|vercel\.com)\/[\S]*/gi,'internal service record')
  .replace(/\bGitHub\b/gi,'development platform').replace(/\bVercel\b/gi,'hosting platform');
}
export function clientActivity(event:{event:string;status:string}){
 return {label:event.event==='push'?'Website software update':'Website publication check',
  result:event.status==='changed'?'Update recorded':event.status==='success'?'Published':event.status==='failure'?'Publication failed':event.status==='error'?'Publication error':'In progress'};
}
