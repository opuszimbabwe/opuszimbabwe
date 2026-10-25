import {json} from '../_lib/auth';
import type {PagesHandler} from '../_lib/types';
export const onRequestGet:PagesHandler=async c=>{
 try{const rows=(await c.env.DB.prepare('SELECT price_usd,name,summary,features,visible FROM care_plans WHERE visible=1 ORDER BY price_usd').all<{price_usd:number;name:string;summary:string;features:string;visible:number}>()).results;return json({plans:rows.map(r=>({...r,features:JSON.parse(r.features)}))},200,{'cache-control':'no-store'});}catch{return json({error:'Plans are temporarily unavailable.'},503);}
};
