// Utilitários puros do Castanha: dinheiro (centavos), meses (YYYY-MM), plural e mensagens.

/** Lê "1200", "1.200", "1.200,50", "R$ 1.200,50" ou "1200.5" e devolve centavos. Inválido ou ≤ 0 → null. */
export function parseCentavos(txt: string): number | null {
  let s = String(txt ?? '').replace(/R\$/gi, '').replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const centavos = Math.round(Number(s) * 100);
  return centavos > 0 ? centavos : null;
}

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatBRL(centavos: number): string {
  return fmtBRL.format((centavos || 0) / 100);
}

/** Mês (YYYY-MM) de um instante, no fuso da Cajuna. */
export function mesISO(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(ms).slice(0, 7);
}

function indice(mes: string): number {
  const [a, m] = mes.split('-').map(Number);
  return a * 12 + (m - 1);
}

function deIndice(i: number): string {
  const a = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${a}-${String(m).padStart(2, '0')}`;
}

export function somarMeses(mes: string, n: number): string {
  return deIndice(indice(mes) + n);
}

/** Quantos meses de a até b (b − a). */
export function diffMeses(a: string, b: string): number {
  return indice(b) - indice(a);
}

const NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function nomeMes(mes: string): string {
  if (!/^\d{4}-\d{2}$/.test(mes)) return '—';
  const [a, m] = mes.split('-');
  return `${NOMES[Number(m) - 1]}/${a.slice(2)}`;
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

export const MENSAGEM_PADRAO =
  'Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Vi que você pediu um orçamento[ de {precisa}]. Posso te fazer umas perguntinhas rápidas?';
export const MENSAGEM_PADRAO_CLIENTES = 'Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Tudo bem por aí?';

export type VarsMensagem = { nome: string; admin: string; precisa: string; negocio: string };

function primeiroNome(nome: string): string {
  const p = nome.trim().split(/\s+/)[0] ?? '';
  return p ? p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1).toLocaleLowerCase('pt-BR') : '';
}

/** Preenche {variáveis}; trechos entre [ ] somem se alguma variável dentro deles estiver vazia. */
export function montarMensagem(modelo: string, vars: VarsMensagem): string {
  const limpo = (v: string) => {
    const t = (v ?? '').trim();
    return t.startsWith('<test lead') ? '' : t;
  };
  const valores: Record<string, string> = {
    nome: primeiroNome(limpo(vars.nome)),
    admin: limpo(vars.admin),
    precisa: limpo(vars.precisa).toLocaleLowerCase('pt-BR'),
    negocio: limpo(vars.negocio),
  };
  const preencher = (txt: string) => txt.replace(/\{(\w+)\}/g, (_, k: string) => valores[k] ?? '');
  const comTrechos = modelo.replace(/\[([^\]]*)\]/g, (_, dentro: string) => {
    const chaves = [...dentro.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    return chaves.every((k) => valores[k]) ? dentro : '';
  });
  return preencher(comTrechos)
    .replace(/[[\]{}]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.!?])/g, '$1')
    .trim();
}
