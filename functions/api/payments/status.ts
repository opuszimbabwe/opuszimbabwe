import { authorisedPayment, reconcile, receipt, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 try { const row = await reconcile(context.env, await authorisedPayment(context)); return json({ receipt: receipt(row), continueUrl: row.status === 'INITIATED' ? row.redirect_url : null }, 200, { 'cache-control': 'no-store' }); }
 catch (error) { return fail(error); }
};
