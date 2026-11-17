// Tipos e regras do funil "Facebook Lead Ads" (lógica pura, sem React nem rede).
// Os campos espelham o que o Apps Script devolve (docs/apps-script/facebook-leads.gs).

export const ETAPAS_FB = [
  'Novo',
  'Tentando contato',
  'Em conversa',
  'Reunião agendada',
  'Proposta enviada',
  'Negociação',
  'Ganho',
  'Perdido',
] as const;
export type EtapaFb = (typeof ETAPAS_FB)[number];

export const MOTIVOS_PERDA = [
  'Sem resposta',
  'Sem orçamento',
  'Só curiosidade',
  'Fechou com outro',
  'Fora do perfil',
  'Outro',
] as const;

const CAMPOS_TEXTO = [
  'id',
  'chegouEm',
  'anuncioId',
  'anuncio',
  'publicoId',
  'publico',
  'campanhaId',
  'campanha',
  'formularioId',
  'formulario',
  'organico',
  'plataforma',
  'oQuePrecisa',
  'faseDoNegocio',
  'negocio',
  'nome',
  'whatsapp',
  'statusMeta',
  'etapa',
  'responsavel',
  'proximoPasso',
  'dataProximoPasso',
  'motivoPerda',
  'anotacoes',
  'atualizadoEm',
  'atualizadoPor',
] as const;

type CampoTexto = (typeof CAMPOS_TEXTO)[number];

export type FbLead = Record<CampoTexto, string> & {
  teste: boolean;
  outras: Record<string, string>;
};

export type CamposEditaveis = Partial<
  Pick<FbLead, 'etapa' | 'responsavel' | 'proximoPasso' | 'dataProximoPasso' | 'motivoPerda' | 'anotacoes'>
>;

export type FiltrosFb = {
  busca: string;
  campanha: string;
  responsavel: string;
  mostrarTeste: boolean;
  verTodosFechados: boolean;
};

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

const texto = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

export function isEtapaFb(v: string): v is EtapaFb {
  return (ETAPAS_FB as readonly string[]).includes(v);
}

export function normalizarLead(raw: unknown): FbLead {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const lead = {} as FbLead;
  for (const campo of CAMPOS_TEXTO) lead[campo] = texto(r[campo]);
  if (!isEtapaFb(lead.etapa)) lead.etapa = 'Novo';
  // Se a planilha converteu a data em data completa, volta para YYYY-MM-DD (fuso da Cajuna).
  if (/^\d{4}-\d{2}-\d{2}T/.test(lead.dataProximoPasso)) {
    const t = Date.parse(lead.dataProximoPasso);
    lead.dataProximoPasso = Number.isNaN(t) ? '' : hojeISO(t);
  }
  lead.teste = r.teste === true;
  lead.outras = {};
  if (r.outras && typeof r.outras === 'object') {
    for (const [k, v] of Object.entries(r.outras as Record<string, unknown>)) {
      if (texto(v)) lead.outras[k] = texto(v);
    }
  }
  return lead;
}

export function whatsappLink(raw: string): string | null {
  const digitos = (raw || '').replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 13) return null;
  const comDdi = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comDdi}`;
}

function parse(iso: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export function tempoDesde(iso: string, now: number): string {
  const t = parse(iso);
  if (t === null) return '—';
  const d = Math.max(0, now - t);
  if (d < MIN) return 'agora';
  if (d < HORA) return `há ${Math.floor(d / MIN)} min`;
  if (d < DIA) return `há ${Math.floor(d / HORA)}h`;
  const dias = Math.floor(d / DIA);
  return `há ${dias} dia${dias === 1 ? '' : 's'}`;
}

export function formatarData(iso: string): string {
  const t = parse(iso);
  if (t === null) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(t)
    .replace(',', '');
}

export function novoAtrasado(l: FbLead, now: number): boolean {
  const t = parse(l.chegouEm);
  return l.etapa === 'Novo' && t !== null && now - t > HORA;
}

const fechado = (l: FbLead) => l.etapa === 'Ganho' || l.etapa === 'Perdido';

export function proximoPassoVencido(l: FbLead, hojeISO: string): boolean {
  return !!l.dataProximoPasso && !fechado(l) && l.dataProximoPasso < hojeISO;
}

export function validarCampos(atual: FbLead, campos: CamposEditaveis): string | null {
  const etapa = campos.etapa ?? atual.etapa;
  const motivo = campos.motivoPerda ?? atual.motivoPerda;
  if (etapa === 'Perdido' && !motivo.trim()) return 'Informe o motivo da perda.';
  return null;
}

export function aplicarCampos(
  l: FbLead,
  campos: CamposEditaveis,
): { lead: FbLead; enviar: CamposEditaveis } {
  const enviar: CamposEditaveis = { ...campos };
  const lead: FbLead = { ...l, ...campos };
  if (lead.etapa !== 'Perdido' && lead.motivoPerda) {
    lead.motivoPerda = '';
    enviar.motivoPerda = '';
  }
  return { lead, enviar };
}

function semAcento(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function filtrarLeads(leads: FbLead[], f: FiltrosFb, now: number): FbLead[] {
  const busca = semAcento(f.busca.trim());
  const buscaDigitos = f.busca.replace(/\D/g, '');
  return leads.filter((l) => {
    if (l.teste && !f.mostrarTeste) return false;
    if (f.campanha && l.campanha !== f.campanha) return false;
    if (f.responsavel && l.responsavel !== f.responsavel) return false;
    if (busca) {
      const porNome = semAcento(l.nome).includes(busca);
      const porFone = buscaDigitos.length > 0 && l.whatsapp.replace(/\D/g, '').includes(buscaDigitos);
      if (!porNome && !porFone) return false;
    }
    if (fechado(l) && !f.verTodosFechados) {
      const t = parse(l.atualizadoEm) ?? parse(l.chegouEm);
      if (t !== null && now - t > 30 * DIA) return false;
    }
    return true;
  });
}

export type ResumoFb = {
  novos7d: number;
  porEtapa: Record<EtapaFb, number>;
  novosAtrasados: number;
  taxaGanho: number | null;
};

export function resumoFb(leads: FbLead[], now: number): ResumoFb {
  const porEtapa = Object.fromEntries(ETAPAS_FB.map((e) => [e, 0])) as Record<EtapaFb, number>;
  let novos7d = 0;
  let novosAtrasados = 0;
  for (const l of leads) {
    if (l.teste) continue;
    porEtapa[isEtapaFb(l.etapa) ? l.etapa : 'Novo']++;
    const t = parse(l.chegouEm);
    if (t !== null && now - t <= 7 * DIA) novos7d++;
    if (novoAtrasado(l, now)) novosAtrasados++;
  }
  const fechados = porEtapa.Ganho + porEtapa.Perdido;
  return { novos7d, porEtapa, novosAtrasados, taxaGanho: fechados ? porEtapa.Ganho / fechados : null };
}

/** Data de hoje (YYYY-MM-DD) no fuso da Cajuna. */
export function hojeISO(now: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(now);
}

const EDITAVEIS = ['etapa', 'responsavel', 'proximoPasso', 'dataProximoPasso', 'motivoPerda', 'anotacoes'] as const;

/**
 * Depois de salvar: parte do lead que está no cache (pode ter sido trocado por um
 * refetch antigo durante o salvamento), reaplica os campos salvos e as marcas de atualização.
 */
export function mesclarSalvo(noCache: FbLead, salvo: FbLead, resposta: Partial<FbLead>): FbLead {
  const r: FbLead = { ...noCache };
  for (const c of EDITAVEIS) r[c] = salvo[c];
  r.atualizadoEm = resposta.atualizadoEm ?? salvo.atualizadoEm;
  r.atualizadoPor = resposta.atualizadoPor ?? salvo.atualizadoPor;
  return r;
}

/** Compara códigos de admin ignorando maiúsculas e espaços. */
export function codigoNaLista(codigo: string, lista: Iterable<string>): boolean {
  const alvo = codigo.trim().toLowerCase();
  if (!alvo) return false;
  for (const c of lista) if (c.trim().toLowerCase() === alvo) return true;
  return false;
}
