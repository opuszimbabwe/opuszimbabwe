import { publicOrder, type DomainOrder } from '../../_lib/domains';
import { authorisedPayment, reconcile, receipt, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 try { const row = await reconcile(context.env, await authorisedPayment(context)); const order=await context.env.DB.prepare('SELECT * FROM domain_orders WHERE payment_id=?').bind(row.id).first<DomainOrder>(); return json({ receipt: receipt(row), domainOrder: order?publicOrder(order):null, continueUrl: row.status === 'INITIATED' ? row.redirect_url : null }, 200, { 'cache-control': 'no-store' }); }
 catch (error) { return fail(error); }
};
