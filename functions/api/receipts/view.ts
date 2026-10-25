import {authorisedReceipt,verifiedReceipt} from '../../_lib/receipts';
import {receiptMarkup} from '../../../lib/receipt-template';
import {json} from '../../_lib/auth';
import {fail,limitAttempts} from '../../_lib/payments';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async context=>{const {env,request}=context;try{const row=await authorisedReceipt(env,new URL(request.url).searchParams.get('id'),request.headers.get('authorization')?.replace(/^Bearer /,''));await limitAttempts(context,'receipt-view',60);const data=await verifiedReceipt(env,row.payment_id);return json({receipt:data.receipt,domain:data.domain,html:receiptMarkup(data.receipt,data.domain)},200,{'cache-control':'no-store','referrer-policy':'no-referrer'});}catch(error){return fail(error)}};
