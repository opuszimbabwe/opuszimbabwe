// Cloudflare Access enforcement for admin endpoints.
//
// Deny-by-default: every admin endpoint requires a request that passed
// through Cloudflare Access (edge authentication for the Opus Zimbabwe
// account, allow-listed to info.opuszim@gmail.com).
//
// Two modes:
//  - Header mode (default): requires both `Cf-Access-Authenticated-User-Email`
//    and `Cf-Access-Jwt-Assertion` headers with an allow-listed email.
//  - Strict mode: when CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are set, the
//    Access JWT is cryptographically verified (signature via the team JWKS,
//    audience, expiry, email claim). Use this in production so requests that
//    bypass Access (e.g. via the *.pages.dev URL) cannot spoof the headers.

import { Env, PagesContext } from './types';

const DEFAULT_ADMINS = 'info.opuszim@gmail.com';

export function allowedAdmins(env: Env): string[] {
  const raw = (env.ALLOWED_ADMINS || DEFAULT_ADMINS).trim();
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function unauthorized(reason: string): Response {
  return json({ error: 'unauthorized', hint: reason }, 401);
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJwtPart(part: string): any {
  return JSON.parse(new TextDecoder().decode(b64urlDecode(part)));
}

let jwksCache: { keys: any[]; fetchedAt: number } | null = null;

async function fetchJwks(teamDomain: string): Promise<any[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < 10 * 60 * 1000) return jwksCache.keys;
  const res = await fetch(`${teamDomain.replace(/\/+$/, '')}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`JWKS fetch failed (${res.status})`);
  const body = await res.json();
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

interface VerifiedAccess {
  email: string | null;
}

// Returns the verified Access identity, or null when the token is invalid.
async function verifyAccessJwt(env: Env, token: string): Promise<VerifiedAccess | null> {
  const teamDomain = (env.CF_ACCESS_TEAM_DOMAIN || '').trim();
  const aud = (env.CF_ACCESS_AUD || '').trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  let header: any;
  let payload: any;
  try {
    header = decodeJwtPart(parts[0]);
    payload = decodeJwtPart(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256') return null;

  let keys: any[];
  try {
    keys = await fetchJwks(teamDomain);
  } catch {
    return null;
  }
  const jwk = keys.find((k) => k && k.kid === header.kid) || (keys.length === 1 ? keys[0] : null);
  if (!jwk) return null;

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  } catch {
    return null;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  const signature = b64urlDecode(parts[2]);
  const ok = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    signature.buffer as ArrayBuffer,
    data
  );
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return null;

  return { email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null };
}

function strictMode(env: Env): boolean {
  return Boolean((env.CF_ACCESS_TEAM_DOMAIN || '').trim() && (env.CF_ACCESS_AUD || '').trim());
}

// Returns the authenticated admin email, or a 401 Response to send back.
export async function requireAdmin(context: PagesContext): Promise<string | Response> {
  const { env, request } = context;
  const allowed = allowedAdmins(env);
  const emailHeader = (request.headers.get('Cf-Access-Authenticated-User-Email') || '').trim().toLowerCase();
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');

  if (!jwt) {
    return unauthorized(
      'Cloudflare Access did not authenticate this request. Open this site through the Access-protected hostname (see docs/ADMIN.md).'
    );
  }

  if (strictMode(env)) {
    const verified = await verifyAccessJwt(env, jwt);
    if (!verified) return unauthorized('Cloudflare Access JWT verification failed.');
    const email = verified.email;
    if (!email || !allowed.includes(email)) {
      return unauthorized(`Access identity ${email || '(none)'} is not an allowed admin.`);
    }
    if (emailHeader && emailHeader !== email) return unauthorized('Access header and JWT do not match.');
    return email;
  }

  if (!emailHeader) {
    return unauthorized('Missing Cloudflare Access identity header.');
  }
  if (!allowed.includes(emailHeader)) {
    return unauthorized(`Email ${emailHeader} is not an allowed admin.`);
  }
  return emailHeader;
}
