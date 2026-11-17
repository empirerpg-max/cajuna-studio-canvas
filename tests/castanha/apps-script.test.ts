import { test, expect } from 'bun:test';
import { chamarScript } from '@/lib/castanha/apps-script.server';

function fakeFetch(body: string) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(body, { status: 200 });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

test('resposta HTML é rejeitada', async () => {
  const { impl } = fakeFetch('<html><body>Login do Google</body></html>');
  await expect(chamarScript('https://x', { a: 1 }, impl)).rejects.toThrow('Resposta inválida do Apps Script');
});

test('resposta JSON é devolvida', async () => {
  const { impl } = fakeFetch('{"ok":true,"x":1}');
  expect(await chamarScript('https://x', { a: 1 }, impl)).toEqual({ ok: true, x: 1 });
});

test('chamada usa POST text/plain e segue redirect', async () => {
  const { impl, calls } = fakeFetch('{"ok":true}');
  await chamarScript('https://x', { a: 1 }, impl);
  expect(calls[0].url).toBe('https://x');
  expect(calls[0].init.method).toBe('POST');
  expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBe('text/plain;charset=utf-8');
  expect(calls[0].init.redirect).toBe('follow');
  expect(calls[0].init.body).toBe('{"a":1}');
});
