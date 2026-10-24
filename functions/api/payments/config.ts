import { configured, currencies, localMethods, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 try {
  const currency = new URL(context.request.url).searchParams.get('currency') || 'USD';
  const [activeCurrencies, methods] = await Promise.all([currencies(), localMethods(currency)]);
  return json({ configured: configured(context.env), currencies: activeCurrencies, methods }, 200, { 'cache-control': 'no-store' });
 } catch (error) { return fail(error); }
};
