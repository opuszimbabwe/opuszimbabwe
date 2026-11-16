import { configured, currencies, localMethods, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 try {
  const currency = new URL(context.request.url).searchParams.get('currency') || 'USD';
  const [activeCurrencies, methods] = await Promise.all([currencies(), localMethods(currency)]);
  return json({ configured: configured(context.env), currencies: activeCurrencies, methods,
   paynow: {configured:false,note:'OneMoney, POS2U and Telecash use Paynow only when enabled in this integration. Complete the selected method on Paynow; merchant availability is controlled by Paynow. Other site methods use Pesepay.'}
  }, 200, { 'cache-control': 'no-store' });
 } catch (error) { return fail(error); }
};
