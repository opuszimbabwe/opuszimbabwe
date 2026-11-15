// workers/care-scheduler.ts
var care_scheduler_default = {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      const response = await fetch("https://opuszim.co.zw/api/maintenance/tick", { method: "POST", headers: { authorization: `Bearer ${env.MAINTENANCE_CRON_SECRET}` }, redirect: "manual", signal: AbortSignal.timeout(115e3) });
      if (!response.ok) throw new Error(`Care scheduler returned HTTP ${response.status}`);
    })());
  }
};
export {
  care_scheduler_default as default
};
//# sourceMappingURL=care-scheduler.js.map
