import {authorisedCareOrder,publicCareOrder} from '../../_lib/client-care';
import {fail,limitAttempts} from '../../_lib/payments';
import {json} from '../../_lib/auth';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{const order=await authorisedCareOrder(c.env,new URL(c.request.url).searchParams.get('id'),c.request.headers.get('authorization')?.replace(/^Bearer /,''));await limitAttempts(c,'care-order-view',60);return json({order:await publicCareOrder(c.env,order)},200,{'cache-control':'no-store'});}catch(e){return fail(e);}};
