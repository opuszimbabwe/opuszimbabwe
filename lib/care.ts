export const CARE_TARGETS = [
 {id:'website',name:'Website',url:'https://opuszim.co.zw/'},
 {id:'checkout',name:'Checkout',url:'https://payments.opuszim.co.zw/payments/'},
 {id:'content',name:'Content API',url:'https://opuszim.co.zw/api/content'},
 {id:'payments',name:'Payment configuration',url:'https://payments.opuszim.co.zw/api/payments/config'},
] as const;
export type CareCheck={target:string;slot:number;checked_at:string;ok:number;status:number|null;latency_ms:number;detail:string};
export type CareIncident={id:string;target:string;opened_at:string;resolved_at:string|null;detail:string;alert_status:string;alert_error?:string|null};
export type CareEvent={id:string;category:string;title:string;note:string;actor:string;created_at:string};
export type CareSnapshot={project:string;month:string;generated_at:string;period_start:string;period_end:string;checks:number;successful:number;expected:number;coverage:number;sample_availability:number|null;targets:{name:string;checks:number;successful:number;average_ms:number|null}[];incidents:number;open_incidents:number;incident_details?:Pick<CareIncident,'target'|'opened_at'|'resolved_at'|'detail'>[];maintenance:{category:string;title:string;note:string;created_at:string}[];backup_status:string;actions:string[]};
export type CareReport={id:string;month:string;snapshot:CareSnapshot;state:string;approved_by:string|null;approved_at:string|null;delivery_status:string;delivery_error:string|null;recipient:string|null;provider_id?:string|null;pdf_key?:string|null;updated_at:string};
export type CareProject={id:string;name:string;email:string;alert_email:string;plan_usd:number;enabled:number;last_tick:string|null;created_at:string};
export type CarePlan={price_usd:number;name:string;summary:string;features:string[];visible:number};
export const careDate=(value:string)=>new Intl.DateTimeFormat('en-ZW',{timeZone:'Africa/Harare',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
