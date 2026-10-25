export type DomainPricing = { markup_percent: number; minimum_markup_minor: number; rounding_minor: number };
export const DEFAULT_DOMAIN_PRICING: DomainPricing = { markup_percent: 25, minimum_markup_minor: 500, rounding_minor: 1 };
export function retailMinor(cost: number, policy: DomainPricing) { return Math.ceil((cost + Math.max(policy.minimum_markup_minor, Math.ceil(cost * policy.markup_percent / 100))) / policy.rounding_minor) * policy.rounding_minor; }
export function normaliseDomain(value: unknown) {
 if (typeof value !== 'string' || value.length > 253 || /[\s/@:#?\\]/.test(value.trim())) return '';
 try { const domain = new URL('https://' + value.trim().toLowerCase()).hostname; return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ? domain : ''; } catch { return ''; }
}
export type RegistryField = { path: string[]; label: string; description: string; type: string; values?: (string | number | boolean)[]; required: boolean };
export type DomainQuote = { domain: string; extension: string; registrable: boolean; assisted: boolean; reason?: string; registration_minor?: number; renewal_minor?: number; fields?: RegistryField[]; privacy?: boolean };
export type DomainPublicOrder = { id: string; domain: string; state: string; retail_minor: number; renewal_minor: number | null; expires: number; payment_id: string | null; payer_name: string; payer_email: string; message?: string; terminal: boolean };
