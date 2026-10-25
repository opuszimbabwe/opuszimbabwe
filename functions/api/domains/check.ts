import { checkDomain, publicQuote } from '../../_lib/domains';
import { trustedOrigin, readPaymentJson, limitAttempts, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try { trustedOrigin(context.request); await limitAttempts(context,'domain-check',30); const body=await readPaymentJson(context.request);return json(publicQuote(await checkDomain(context.env,body.domain)),200,{'cache-control':'no-store'}); }catch(error){return fail(error);}
};
