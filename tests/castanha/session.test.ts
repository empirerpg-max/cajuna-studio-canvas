import { test, expect } from 'bun:test';
import { signSession, verifySession } from '@/lib/castanha/session';

const p = { nome: 'Ana', codigo: 'ADM1', exp: Date.now() + 60_000 };

test('ida e volta', async () => {
  expect(await verifySession(await signSession(p, 's1'), 's1')).toEqual(p);
});

test('segredo errado', async () => {
  expect(await verifySession(await signSession(p, 's1'), 's2')).toBeNull();
});

test('payload adulterado', async () => {
  const [, sig] = (await signSession(p, 's1')).split('.');
  const fake = Buffer.from(JSON.stringify({ ...p, codigo: 'X' })).toString('base64url');
  expect(await verifySession(`${fake}.${sig}`, 's1')).toBeNull();
});

test('expirado', async () => {
  expect(await verifySession(await signSession({ ...p, exp: 1 }, 's1'), 's1')).toBeNull();
});

test('lixo / vazio / sem segredo', async () => {
  expect(await verifySession(undefined, 's1')).toBeNull();
  expect(await verifySession('abc', 's1')).toBeNull();
  expect(await verifySession(await signSession(p, 's1'), '')).toBeNull();
});
