export const CARE_TARGETS = [
 {id:'website',name:'Website',url:'https://opuszim.co.zw/'},
 {id:'checkout',name:'Checkout',url:'https://payments.opuszim.co.zw/payments/'},
 {id:'content',name:'Content API',url:'https://opuszim.co.zw/api/content'},
 {id:'payments',name:'Payment configuration',url:'https://payments.opuszim.co.zw/api/payments/config'},
] as const;
export const CARE_PDF_VERSION=3;
export type CareCheck={target:string;slot:number;checked_at:string;ok:number;status:number|null;latency_ms:number;detail:string};
export type CareIncident={id:string;target:string;opened_at:string;resolved_at:string|null;detail:string;alert_status:string;alert_error?:string|null};
export type CareEvent={id:string;category:string;title:string;note:string;actor:string;created_at:string};
export type CareSnapshot={repository_events?:{event:string;status:string;context:string;commit_sha:string;occurred_at:string}[];target_definitions?:{id:string;name:string;url:string}[];project:string;month:string;generated_at:string;period_start:string;period_end:string;checks:number;successful:number;expected:number;coverage:number;sample_availability:number|null;targets:{name:string;checks:number;successful:number;average_ms:number|null}[];incidents:number;open_incidents:number;latest_checks?:Pick<CareCheck,'target'|'checked_at'|'ok'|'status'|'latency_ms'|'detail'>[];incident_details?:Pick<CareIncident,'target'|'opened_at'|'resolved_at'|'detail'>[];maintenance:{category:string;title:string;note:string;created_at:string}[];backup_status:string;actions:string[]};
export type CareReport={id:string;month:string;snapshot:CareSnapshot;state:string;approved_by:string|null;approved_at:string|null;delivery_status:string;delivery_error:string|null;recipient:string|null;provider_id?:string|null;pdf_key?:string|null;revision:number;pdf_version:number;editions?:{revision:number;approved_at:string;delivery_status:string}[];updated_at:string};
export type CareProject={id:string;name:string;email:string;alert_email:string;plan_usd:number;enabled:number;last_tick:string|null;created_at:string};
export type CarePlan={price_usd:number;name:string;summary:string;features:string[];visible:number};
export const careDate=(value:string)=>new Intl.DateTimeFormat('en-ZW',{timeZone:'Africa/Harare',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
export function careOutcome(data:CareSnapshot){
 if(data.open_incidents>0)return {kind:'failed' as const,title:'Action required',detail:'An incident remains open at the end of this reporting period.'};
 if(!data.checks)return {kind:'neutral' as const,title:'No monitoring evidence yet',detail:'A final result needs recorded checks.'};
 if(data.open_incidents>0||data.latest_checks?.some(c=>!c.ok))return {kind:'failed' as const,title:'Action required',detail:'One or more final service checks failed, or an incident remains open.'};
 if((data.target_definitions||CARE_TARGETS).every(t=>data.latest_checks?.some(c=>c.target===t.id&&c.ok)))return {kind:'passed' as const,title:data.incidents?'Services recovered — final checks passed':'All final checks passed',detail:'All monitored services passed their final recorded check in this period.'};
 if(data.successful===data.checks)return {kind:'passed' as const,title:'All recorded checks passed',detail:'No failed checks or unresolved incidents were recorded in this snapshot.'};
 return {kind:'review' as const,title:'Review the recorded results',detail:'Historical failures are recorded. Final service-level evidence is incomplete in this snapshot.'};
}
