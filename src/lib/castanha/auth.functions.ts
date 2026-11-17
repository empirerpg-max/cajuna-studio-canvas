import process from 'node:process';
import { createServerFn } from '@tanstack/react-start';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';
import { SESSION_MAX_AGE_S, signSession, verifySession } from './session';
import { SESSION_COOKIE } from './config';
import { chamarScript, oldScriptUrl, type RespostaScript } from './apps-script.server';

const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };

export const castanhaLogin = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ usuario: z.string().trim().min(1).max(200), senha: z.string().trim().min(1).max(200) }))
  .handler(async ({ data }): Promise<{ ok: true; nome: string } | { ok: false; erro: string }> => {
    const secret = process.env.CASTANHA_SESSION_SECRET;
    if (!secret) return { ok: false, erro: 'Servidor sem CASTANHA_SESSION_SECRET' };
    let json: RespostaScript;
    try {
      json = await chamarScript(oldScriptUrl(), {
        action: 'login',
        codigo_contrato: data.usuario,
        codigo_unico: data.senha,
      });
    } catch {
      return { ok: false, erro: 'Erro de conexão. Tente novamente.' };
    }
    if (!json.ok) return { ok: false, erro: json.error || 'Usuário ou senha incorretos.' };
    if (String(json.tipo).toLowerCase() !== 'admin') return { ok: false, erro: 'Acesso restrito a administradores.' };

    const nome = String(json.nome ?? '');
    const codigo = String(json.codigo_contrato ?? data.usuario);
    const token = await signSession({ nome, codigo, exp: Date.now() + SESSION_MAX_AGE_S * 1000 }, secret);
    setCookie(SESSION_COOKIE, token, { ...cookieOpts, maxAge: SESSION_MAX_AGE_S });
    return { ok: true, nome };
  });

export const castanhaSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ nome: string; codigo: string } | null> => {
    const s = await verifySession(getCookie(SESSION_COOKIE), process.env.CASTANHA_SESSION_SECRET ?? '');
    return s ? { nome: s.nome, codigo: s.codigo } : null;
  },
);

export const castanhaLogout = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(SESSION_COOKIE, cookieOpts);
  return { ok: true };
});
