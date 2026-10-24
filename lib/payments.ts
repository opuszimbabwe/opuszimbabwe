// Public checkout types only. Gateway SDK and secrets stay in Pages Functions.
export type LocalMethod = { code: string; name: string; minimumAmount: number; maximumAmount: number };
export type PaymentConfig = { configured: boolean; currencies: { code: string; name: string }[]; methods: LocalMethod[] };
export type PaymentReceipt = {
  id: string; name: string; invoice: string; amount: number; invoiceAmount?: number; currency: string; method: string;
  reference: string | null; status: string; paid: boolean; terminal: boolean; date: string | null;
};
export const SUPPORT_EMAIL = 'support@opuszim.co.zw';
export const SECONDARY_EMAIL = 'opuszimbabwe@outlook.com';
export const DIRECT_PHONE = '+263710740387';
export const SUPPORT_PHONE = '+263773979162';
