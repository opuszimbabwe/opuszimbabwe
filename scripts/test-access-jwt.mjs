#!/usr/bin/env node
// Strict-mode Cloudflare Access JWT verification test.
//
// Requires the local Pages server started WITH strict-mode vars, e.g. a
// `.dev.vars` file containing:
//   CF_ACCESS_TEAM_DOMAIN=http://127.0.0.1:8799
//   CF_ACCESS_AUD=local-test-aud
// (this script serves the mock Access JWKS on port 8799)
//
// Usage: node scripts/test-access-jwt.mjs [baseUrl]

import { createServer } from 'node:http';
import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:8788';
const JWKS_PORT = Number(process.env.JWKS_PORT || 8799);
const AUD = 'local-test-aud';

let passed = 0;
let failed = 0;
function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };

function makeJwt(payload) {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' };
  const head = b64url(JSON.stringify(header));
  const body = b64url(JSON.stringify(payload));
  const unsigned = `${head}.${body}`;
  const sig = cryptoSign('RSA-SHA256', Buffer.from(unsigned), privateKey);
  return `${unsigned}.${b64url(sig)}`;
}

const now = Math.floor(Date.now() / 1000);
const validJwt = makeJwt({ aud: AUD, exp: now + 3600, email: 'info.opuszim@gmail.com', iss: 'https://test.cloudflareaccess.com' });
const wrongAudJwt = makeJwt({ aud: 'someone-elses-app', exp: now + 3600, email: 'info.opuszim@gmail.com' });
const wrongEmailJwt = makeJwt({ aud: AUD, exp: now + 3600, email: 'intruder@example.com' });
const expiredJwt = makeJwt({ aud: AUD, exp: now - 60, email: 'info.opuszim@gmail.com' });
const unsignedJwt = `${b64url(JSON.stringify({ alg: 'RS256', kid: 'test-key-1' }))}.${b64url(JSON.stringify({ aud: AUD, exp: now + 3600, email: 'info.opuszim@gmail.com' }))}.tampered`;

async function session(jwt) {
  const res = await fetch(`${BASE}/api/admin/session`, { headers: { 'Cf-Access-Jwt-Assertion': jwt } });
  return res.status;
}

async function main() {
  const jwks = createServer((req, res) => {
    if (req.url === '/cdn-cgi/access/certs') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => jwks.listen(JWKS_PORT, '127.0.0.1', resolve));
  console.log(`Mock Access JWKS listening on 127.0.0.1:${JWKS_PORT}`);
  console.log(`Testing strict Access JWT verification against ${BASE}\n`);

  check('valid Access JWT accepted', (await session(validJwt)) === 200, `status ${await session(validJwt)}`);
  check('wrong audience rejected', (await session(wrongAudJwt)) === 401);
  check('wrong email rejected', (await session(wrongEmailJwt)) === 401);
  check('expired JWT rejected', (await session(expiredJwt)) === 401);
  check('tampered signature rejected', (await session(unsignedJwt)) === 401);
  check('missing JWT rejected', (await fetch(`${BASE}/api/admin/session`)).status === 401);

  jwks.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
