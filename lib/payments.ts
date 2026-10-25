// Public checkout types only. Gateway SDK and secrets stay in Pages Functions.
export type LocalMethod = { code: string; name: string; minimumAmount: number; maximumAmount: number; redirectRequired?: boolean; phoneField?: string };
export type PaymentConfig = { configured: boolean; currencies: { code: string; name: string }[]; methods: LocalMethod[] };
export type PaymentReceipt = {
  id: string; name: string; invoice: string; amount: number; invoiceAmount?: number; currency: string; method: string;
  reference: string | null; status: string; paid: boolean; terminal: boolean; date: string | null;
};
export const SUPPORT_EMAIL = 'support@opuszim.co.zw';
export const SECONDARY_EMAIL = 'opuszimbabwe@outlook.com';
export const DIRECT_PHONE = '+263710740387';
export const SUPPORT_PHONE = '+263773979162';

export type MobileNetwork = 'ecocash' | 'onemoney';
export function mobileNetwork(name: string): MobileNetwork | null {
 return /ecocash/i.test(name) ? 'ecocash' : /one\s?money/i.test(name) ? 'onemoney' : null;
}
export function normaliseMobile(value: string) {
 return value.trim().replace(/[\s()-]/g, '').replace(/^(?:\+263|00263|263)/, '0');
}
export function mobileNumberError(value: string, network: MobileNetwork, complete = true) {
 const number = normaliseMobile(value);
 if (!number) return complete ? 'Enter the mobile money number you want to pay with.' : '';
 if (!/^\d+$/.test(number)) return 'Enter a valid Zimbabwean mobile number.';
 if (number.length >= 3 && !(network === 'onemoney' ? /^071/.test(number) : /^07[789]/.test(number))) {
  return network === 'onemoney' ? 'Currently, OneMoney numbers start with 071. Please check your number.' : 'EcoCash accepts numbers starting with 077, 078 or 079. Please check your number.';
 }
 if (number.length > 10 || (complete && number.length !== 10)) return 'Enter the full 10-digit mobile number, including the initial 0, or use +263.';
 return '';
}
