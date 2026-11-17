import {paynowConfigured,paynowMethods} from '../../_lib/paynow';
import { configured, currencies, localMethods, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 try {
  const currency = new URL(context.request.url).searchParams.get('currency') || 'USD';
  const [activeCurrencies, methods] = await Promise.all([currencies(), localMethods(currency)]);
  return json({ configured: configured(context.env)||paynowConfigured(context.env), currencies: activeCurrencies.filter(c=>c.code==='USD'), methods: [...methods.filter(m=>! /one\s?money|pos2u|telecash/i.test(m.name)),...paynowMethods(context.env,currency)],
   paynow: {configured:paynowConfigured(context.env),note:'OneMoney uses Paynow remote mobile checkout. POS2U and Telecash use hosted Paynow. InnBucks and Omari use direct Pesepay wallet checkout; cards stay hosted.'}
  }, 200, { 'cache-control': 'no-store' });
 } catch (error) { return fail(error); }
};
