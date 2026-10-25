'use client';
import { useCallback, useEffect, useState } from 'react';
type Row = { id: string; payer_name: string; payer_email: string; invoice: string; amount_minor: number; currency: string; method_name: string; gateway_reference: string | null; status: string; transaction_date: string | null; created_at: string; gateway_error_code?: string; gateway_error_message?: string };
export default function PaymentLedger() {
 const [rows, setRows] = useState<Row[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
 const refresh = useCallback(async () => {
  setBusy(true); setError('');
  try {
   const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
   const headers: Record<string, string> = local ? { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'opus-admin-dashboard-session' } : {};
   const response = await fetch('/api/admin/transactions', { cache: 'no-store', headers });
   const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Please sign in again to view payments.'); setRows(body.payments);
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Payments could not be loaded.'); }
  finally { setBusy(false); }
 }, []);
 async function verify(id: string) {
  setBusy(true); setError('');
  try {
   const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
   const headers: Record<string, string> = { 'content-type': 'application/json', ...(local ? { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'opus-admin-dashboard-session' } : {}) };
   const response = await fetch('/api/admin/transactions', { method: 'POST', headers, body: JSON.stringify({ id }) });
   const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Verification failed.'); await refresh();
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Verification failed.'); }
  finally { setBusy(false); }
 }
 useEffect(() => { void refresh(); }, [refresh]);
 return <section className="rounded-3xl border bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Customer payments</h2><p className="mt-2 text-sm text-black/60">Latest 100 checkout records. SUCCESS means the gateway status, amount and currency were verified. Use Pesepay for settlement and fee reports.</p></div><button type="button" onClick={() => void refresh()} disabled={busy} className="rounded-full border px-5 py-2 text-sm font-semibold">{busy ? 'Loading…' : 'Refresh'}</button></div>{error && <p className="mt-5 text-sm text-red-700" role="alert">{error}</p>}<div className="mt-6 overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">Payer / invoice</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Reference / date</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b"><td className="p-3"><strong>{row.payer_name || 'Payment via Pesepay'}</strong>{row.payer_email && <p className="mt-1 text-xs text-black/60">{row.payer_email}</p>}<p className="mt-1">{row.invoice}</p></td><td className="whitespace-nowrap p-3">{row.currency} {(row.amount_minor / 100).toFixed(2)}</td><td className="p-3">{row.method_name}</td><td className={`p-3 font-semibold ${row.status === 'SUCCESS' ? 'text-green-700' : ''}`}>{row.status}{row.gateway_error_code && <p className="mt-2 text-xs font-normal text-red-700">{row.gateway_error_code}: {row.gateway_error_message}</p>}<button type="button" className="mt-2 block text-xs font-normal text-[#a33b18] underline" disabled={busy} onClick={() => void verify(row.id)}>Verify with Pesepay</button></td><td className="p-3"><span className="break-all text-xs">{row.gateway_reference || row.id}</span><p className="mt-2 text-xs text-black/60">{new Date(row.transaction_date || row.created_at).toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })} CAT</p></td></tr>)}</tbody></table>{!busy && !rows.length && !error && <p className="py-6 text-center text-sm text-black/60">No customer payments yet.</p>}</div></section>;
}
