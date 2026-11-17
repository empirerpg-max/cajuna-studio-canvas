// Token de sessão do /castanha: "<base64url(json)>.<base64url(hmac-sha256)>".
// Só usa Web Crypto, então roda igual no Cloudflare Workers e nos testes.

export type SessionPayload = { nome: string; codigo: string; exp: number };

export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function hmacKey(secret: string, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    usage,
  ]);
}

export async function signSession(p: SessionPayload, secret: string): Promise<string> {
  if (!secret) throw new Error('Segredo de sessão ausente');
  const body = toBase64Url(encoder.encode(JSON.stringify(p)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<SessionPayload | null> {
  try {
    if (!token || !secret) return null;
    const [body, sig, extra] = token.split('.');
    if (!body || !sig || extra !== undefined) return null;
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, 'verify'),
      fromBase64Url(sig),
      encoder.encode(body),
    );
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (typeof p?.nome !== 'string' || typeof p?.codigo !== 'string' || typeof p?.exp !== 'number') return null;
    if (p.exp <= now) return null;
    return { nome: p.nome, codigo: p.codigo, exp: p.exp };
  } catch {
    return null;
  }
}
