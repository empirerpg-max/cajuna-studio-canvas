import process from 'node:process';
import { getCookie } from '@tanstack/react-start/server';
import { verifySession, type SessionPayload } from './session';
import { SESSION_COOKIE } from './config';
import { chamarScriptGet, oldScriptUrl } from './apps-script.server';

const CACHE_MS = 10 * 60_000;
let cacheAdmins: { codigos: Set<string>; em: number } | null = null;

async function codigosAdmins(): Promise<Set<string>> {
  if (cacheAdmins && Date.now() - cacheAdmins.em < CACHE_MS) return cacheAdmins.codigos;
  try {
    const json = await chamarScriptGet(`${oldScriptUrl()}?action=getAdmins`);
    if (!json?.ok || !Array.isArray(json.admins)) throw new Error('getAdmins falhou');
    const codigos = new Set<string>(json.admins.map((a: { codigo?: unknown }) => String(a?.codigo ?? '')));
    cacheAdmins = { codigos, em: Date.now() };
    return codigos;
  } catch (err) {
    // Usa a última lista conhecida, mesmo vencida; sem nenhuma, não libera.
    if (cacheAdmins) return cacheAdmins.codigos;
    console.error('[castanha] não foi possível carregar admins', err);
    throw new Error('Não foi possível verificar o acesso. Tente de novo.');
  }
}

/** Sessão válida e ainda na lista de admins; senão lança NAO_AUTENTICADO. */
export async function requireAdmin(): Promise<SessionPayload> {
  const sessao = await verifySession(getCookie(SESSION_COOKIE), process.env.CASTANHA_SESSION_SECRET ?? '');
  if (!sessao) throw new Error('NAO_AUTENTICADO');
  const codigos = await codigosAdmins();
  if (!codigos.has(sessao.codigo)) throw new Error('NAO_AUTENTICADO');
  return sessao;
}
