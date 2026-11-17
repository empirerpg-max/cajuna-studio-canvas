import process from 'node:process';
import { FB_LEADS_SCRIPT_URL_PADRAO, OLD_SCRIPT_URL } from './config';

export { OLD_SCRIPT_URL };

export type RespostaScript = { ok?: boolean; erro?: string; error?: string; [campo: string]: unknown };

async function lerJson(res: Response): Promise<RespostaScript> {
  const corpo = await res.text();
  try {
    return JSON.parse(corpo);
  } catch {
    console.error('[apps-script] resposta não-JSON', res.status, corpo.slice(0, 200));
    throw new Error('Resposta inválida do Apps Script');
  }
}

/** URL do script antigo (CASTANHA_OLD_SCRIPT_URL permite apontar para um script de teste). */
export function oldScriptUrl(): string {
  return process.env.CASTANHA_OLD_SCRIPT_URL || OLD_SCRIPT_URL;
}

/** POST com JSON em text/plain (Apps Script não responde preflight CORS) seguindo o redirect 302. */
export async function chamarScript(url: string, body: object, fetchImpl: typeof fetch = fetch): Promise<RespostaScript> {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow',
    body: JSON.stringify(body),
  });
  return lerJson(res);
}

/** GET simples (o script antigo expõe getAdmins por query string). */
export async function chamarScriptGet(url: string, fetchImpl: typeof fetch = fetch): Promise<RespostaScript> {
  return lerJson(await fetchImpl(url, { redirect: 'follow' }));
}

/** Chama o script de leads com o token do servidor. Lança erro se o script responder ok:false. */
export async function chamarScriptLeads(body: object): Promise<RespostaScript> {
  const token = process.env.FB_LEADS_TOKEN;
  if (!token) throw new Error('Servidor sem FB_LEADS_TOKEN');
  const url = process.env.FB_LEADS_SCRIPT_URL || FB_LEADS_SCRIPT_URL_PADRAO;
  const json = await chamarScript(url, { ...body, token });
  if (!json.ok) throw new Error(json.erro === 'nao_autorizado' ? 'Token do script de leads inválido' : json.erro || 'Erro no script de leads');
  return json;
}
