import { pricing } from '../../_lib/domains';
import { retailMinor } from '../../../lib/domains';
import { json } from '../../_lib/auth';
import { fail } from '../../_lib/payments';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async ({env}) => {
 try { const [policy,rows]=await Promise.all([pricing(env),env.DB.prepare('SELECT * FROM domain_catalogue ORDER BY extension').all<{extension:string;registration_cost_minor:number|null;renewal_cost_minor:number|null;updated_at:string}>()]);
 return json({extensions:rows.results.map(r=>({extension:r.extension,registration_minor:r.registration_cost_minor===null?null:retailMinor(r.registration_cost_minor,policy),renewal_minor:r.renewal_cost_minor===null?null:retailMinor(r.renewal_cost_minor,policy),updated_at:r.updated_at})),currency:'USD'},200,{'cache-control':'no-store'});
 } catch(error){return fail(error);}
};
