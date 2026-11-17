// Clientes, contratos, movimentos de etapa e os cálculos do painel (lógica pura).
import type { Deal } from '@/lib/crm-types';
import type { FbLead } from './fb-leads';
import { diffMeses, mesISO, somarMeses } from './util';

export type OrigemCliente = 'Facebook Lead Ads' | 'Leads' | 'Manual';

export interface Cliente {
  clienteId: string;
  nome: string;
  whatsapp: string;
  negocio: string;
  origem: OrigemCliente;
  cardId: string;
  funil: string;
  criadoEm: string;
  criadoPor: string;
  obs: string;
}

/** Valores em centavos; meses em YYYY-MM. */
export interface Contrato {
  contratoId: string;
  clienteId: string;
  servico: string;
  valorMensal: number;
  meses: number;
  inicio: string;
  valorUnico: number;
  mesValorUnico: string;
  encerradoEm: string;
  criadoEm: string;
  criadoPor: string;
  obs: string;
}

export interface Movimento {
  movimentoId: string;
  cardId: string;
  funil: string;
  deEtapa: string;
  paraEtapa: string;
  quando: string;
  por: string;
  motivo: string;
  valor: number;
}

export interface DadosCastanha {
  clientes: Cliente[];
  contratos: Contrato[];
  movimentos: Movimento[];
}

export const ETAPA_GANHO: Record<string, string> = { 'Facebook Lead Ads': 'Ganho', Leads: 'Fechado' };
export const ETAPA_PERDIDO = 'Perdido';

const MES_RE = /^\d{4}-\d{2}$/;

export function validarContrato(
  c: Pick<Contrato, 'servico' | 'valorMensal' | 'meses' | 'inicio' | 'valorUnico' | 'mesValorUnico'>,
): string | null {
  if (!c.servico.trim()) return 'Informe o serviço.';
  const temRec = c.valorMensal > 0;
  const temUni = c.valorUnico > 0;
  if (!temRec && !temUni) return 'Informe um valor mensal ou um valor único.';
  if (temRec) {
    if (!Number.isInteger(c.meses) || c.meses < 1 || c.meses > 60) return 'Meses precisa ser de 1 a 60.';
    if (!MES_RE.test(c.inicio)) return 'Escolha o primeiro mês.';
  }
  if (temUni && !MES_RE.test(c.mesValorUnico)) return 'Escolha o mês do valor único.';
  return null;
}

/** Último mês (exclusivo) em que o recorrente conta, ou null se não há recorrente. */
function fimRecorrente(c: Contrato): string | null {
  if (!(c.valorMensal > 0) || !(c.meses > 0) || !MES_RE.test(c.inicio)) return null;
  let fim = somarMeses(c.inicio, c.meses);
  if (MES_RE.test(c.encerradoEm) && c.encerradoEm < fim) fim = c.encerradoEm;
  return fim > c.inicio ? fim : null;
}

export function recorrenteNoMes(c: Contrato, mes: string): number {
  const fim = fimRecorrente(c);
  return fim && mes >= c.inicio && mes < fim ? c.valorMensal : 0;
}

/** Valor único conta se existir e não foi encerrado até o mês dele. */
function unicoValido(c: Contrato): boolean {
  if (!(c.valorUnico > 0) || !MES_RE.test(c.mesValorUnico)) return false;
  return !(MES_RE.test(c.encerradoEm) && c.encerradoEm <= c.mesValorUnico);
}

function unicoNoMes(c: Contrato, mes: string): number {
  return unicoValido(c) && c.mesValorUnico === mes ? c.valorUnico : 0;
}

export function receitaDoMes(cs: Contrato[], mes: string) {
  let recorrente = 0;
  let unico = 0;
  for (const c of cs) {
    recorrente += recorrenteNoMes(c, mes);
    unico += unicoNoMes(c, mes);
  }
  return { recorrente, unico, total: recorrente + unico };
}

/** Soma do que os contratos ainda vão gerar nos meses depois de `mes`. */
export function garantidoDepois(cs: Contrato[], mes: string): number {
  let total = 0;
  for (const c of cs) {
    const fim = fimRecorrente(c);
    if (fim) {
      const de = c.inicio > mes ? c.inicio : somarMeses(mes, 1);
      const n = diffMeses(de, fim);
      if (n > 0) total += n * c.valorMensal;
    }
    if (unicoValido(c) && c.mesValorUnico > mes) total += c.valorUnico;
  }
  return total;
}

export function serieReceita(cs: Contrato[], mesCentral: string) {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = somarMeses(mesCentral, i - 6);
    const r = receitaDoMes(cs, mes);
    return { mes, recorrente: r.recorrente, unico: r.unico };
  });
}

/** Último mês com receita no contrato ('' se nenhum). */
export function terminaEm(c: Contrato): string {
  const fim = fimRecorrente(c);
  const ultimoRec = fim ? somarMeses(fim, -1) : '';
  const ultimoUni = unicoValido(c) ? c.mesValorUnico : '';
  return ultimoRec > ultimoUni ? ultimoRec : ultimoUni;
}

export function contratoAtivo(c: Contrato, mesHoje: string): boolean {
  const t = terminaEm(c);
  return !!t && t >= mesHoje;
}

export function contratosDoCard(d: DadosCastanha, cardId: string): Contrato[] {
  const ids = new Set(d.clientes.filter((c) => c.cardId === cardId).map((c) => c.clienteId));
  return d.contratos.filter((c) => ids.has(c.clienteId));
}

const mesDe = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : mesISO(t);
};

export type ResumoMes = {
  entraram: number;
  ganhos: number;
  perdidos: number;
  conversao: number | null;
  porMotivo: { motivo: string; qtd: number; valor: number }[];
  porEtapa: { etapa: string; qtd: number }[];
  alertaOutro: boolean;
  desde: string | null;
};

export function resumoMes(args: {
  mes: string;
  leadsFb: FbLead[];
  dealsLeads: Deal[];
  movimentos: Movimento[];
}): ResumoMes {
  const { mes, leadsFb, dealsLeads, movimentos } = args;

  const entraram =
    leadsFb.filter((l) => !l.teste && mesDe(l.chegouEm) === mes).length +
    dealsLeads.filter((d) => (!d.funil || d.funil === 'Leads') && !!d.createdAt && mesDe(d.createdAt) === mes).length;

  // Último movimento de cada card
  const ultimo = new Map<string, Movimento>();
  for (const m of movimentos) {
    const atual = ultimo.get(m.cardId);
    if (!atual || (Date.parse(m.quando) || 0) >= (Date.parse(atual.quando) || 0)) ultimo.set(m.cardId, m);
  }

  let ganhos = 0;
  const perdidosMov: Movimento[] = [];
  for (const m of ultimo.values()) {
    if (mesDe(m.quando) !== mes) continue;
    const etapaGanho = ETAPA_GANHO[m.funil];
    if (m.paraEtapa === etapaGanho) ganhos++;
    else if (m.paraEtapa === ETAPA_PERDIDO) perdidosMov.push(m);
  }

  const motivos = new Map<string, { motivo: string; qtd: number; valor: number }>();
  const etapas = new Map<string, number>();
  for (const m of perdidosMov) {
    const motivo = m.motivo || 'Sem motivo';
    const cur = motivos.get(motivo) ?? { motivo, qtd: 0, valor: 0 };
    cur.qtd++;
    cur.valor += m.valor || 0;
    motivos.set(motivo, cur);
    const etapa = m.deEtapa || 'Sem etapa';
    etapas.set(etapa, (etapas.get(etapa) ?? 0) + 1);
  }

  const perdidos = perdidosMov.length;
  const outros = motivos.get('Outro')?.qtd ?? 0;
  const maisAntigo = movimentos.reduce<number | null>((min, m) => {
    const t = Date.parse(m.quando);
    return Number.isNaN(t) ? min : min === null || t < min ? t : min;
  }, null);

  return {
    entraram,
    ganhos,
    perdidos,
    conversao: ganhos + perdidos ? ganhos / (ganhos + perdidos) : null,
    porMotivo: [...motivos.values()].sort((a, b) => b.qtd - a.qtd || b.valor - a.valor),
    porEtapa: [...etapas.entries()].map(([etapa, qtd]) => ({ etapa, qtd })).sort((a, b) => b.qtd - a.qtd),
    alertaOutro: perdidos >= 5 && outros / perdidos > 0.2,
    desde:
      maisAntigo === null
        ? null
        : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza' }).format(maisAntigo),
  };
}
