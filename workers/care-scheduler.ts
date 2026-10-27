export default {
 async scheduled(_event:unknown,env:{MAINTENANCE_CRON_SECRET:string},ctx:{waitUntil:(p:Promise<unknown>)=>void}){
  ctx.waitUntil((async()=>{
   const response=await fetch('https://opuszim.co.zw/api/maintenance/tick',{method:'POST',headers:{authorization:`Bearer ${env.MAINTENANCE_CRON_SECRET}`},redirect:'manual',signal:AbortSignal.timeout(115000)});
   if(!response.ok)throw new Error(`Care scheduler returned HTTP ${response.status}`);
  })());
 },
};
