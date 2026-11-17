import { test, expect, describe } from 'bun:test';
import {
  receitaDoMes,
  garantidoDepois,
  serieReceita,
  validarContrato,
  resumoMes,
  contratoAtivo,
  terminaEm,
  type Contrato,
  type Movimento,
} from '@/lib/castanha/negocio';
import { normalizarLead } from '@/lib/castanha/fb-leads';
import type { Deal } from '@/lib/crm-types';

function contrato(over: Partial<Contrato> = {}): Contrato {
  return {
    contratoId: 'c1', clienteId: 'k1', servico: 'Redes sociais', valorMensal: 0, meses: 0, inicio: '',
    valorUnico: 0, mesValorUnico: '', encerradoEm: '', criadoEm: '', criadoPor: '', obs: '', ...over,
  };
}
const rec = contrato({ valorMensal: 120000, meses: 4, inicio: '2026-12' });
const uni = contrato({ contratoId: 'c2', valorUnico: 350000, mesValorUnico: '2026-11' });

describe('receita', () => {
  test('recorrente dentro do período', () => {
    expect(receitaDoMes([rec], '2026-12').recorrente).toBe(120000);
    expect(receitaDoMes([rec], '2027-03').recorrente).toBe(120000);
  });
  test('recorrente fora do período', () => {
    expect(receitaDoMes([rec], '2027-04').recorrente).toBe(0);
    expect(receitaDoMes([rec], '2026-11').recorrente).toBe(0);
  });
  test('já garantido', () => expect(garantidoDepois([rec], '2026-11')).toBe(480000));
  test('único só no mês dele', () => {
    expect(receitaDoMes([uni], '2026-11')).toEqual({ recorrente: 0, unico: 350000, total: 350000 });
    expect(receitaDoMes([uni], '2026-12').total).toBe(0);
  });
  test('encerrado antes do fim', () => {
    const c = { ...rec, encerradoEm: '2027-02' };
    expect(receitaDoMes([c], '2027-02').recorrente).toBe(0);
    expect(receitaDoMes([c], '2027-01').recorrente).toBe(120000);
  });
  test('encerrado no início ou antes não gera receita nem negativo', () => {
    for (const enc of ['2026-12', '2026-10']) {
      const c = { ...rec, encerradoEm: enc };
      for (const m of ['2026-11', '2026-12', '2027-01', '2027-03']) expect(receitaDoMes([c], m).recorrente).toBe(0);
      expect(garantidoDepois([c], '2026-11')).toBe(0);
    }
  });
  test('série de 12 meses centrada', () => {
    const s = serieReceita([], '2026-11');
    expect(s.length).toBe(12);
    expect(s[6].mes).toBe('2026-11');
  });
  test('terminaEm e ativo', () => {
    expect(terminaEm(rec)).toBe('2027-03');
    expect(terminaEm(uni)).toBe('2026-11');
    expect(contratoAtivo(rec, '2027-03')).toBe(true);
    expect(contratoAtivo(rec, '2027-04')).toBe(false);
  });
});

describe('validarContrato', () => {
  const base = { servico: 'X', valorMensal: 0, meses: 0, inicio: '', valorUnico: 0, mesValorUnico: '' };
  test('serviço', () => expect(validarContrato({ ...base, servico: ' ' })).toBe('Informe o serviço.'));
  test('nenhum valor', () => expect(validarContrato(base)).toBe('Informe um valor mensal ou um valor único.'));
  test('meses', () =>
    expect(validarContrato({ ...base, valorMensal: 100, meses: 0, inicio: '2026-12' })).toBe('Meses precisa ser de 1 a 60.'));
  test('primeiro mês', () =>
    expect(validarContrato({ ...base, valorMensal: 100, meses: 4 })).toBe('Escolha o primeiro mês.'));
  test('mês do único', () => expect(validarContrato({ ...base, valorUnico: 100 })).toBe('Escolha o mês do valor único.'));
  test('válidos', () => {
    expect(validarContrato({ ...base, valorUnico: 100, mesValorUnico: '2026-11' })).toBeNull();
    expect(validarContrato({ ...base, valorMensal: 100, meses: 4, inicio: '2026-12' })).toBeNull();
  });
});

describe('resumoMes', () => {
  let n = 0;
  const mov = (cardId: string, para: string, quando: string, over: Partial<Movimento> = {}): Movimento => ({
    movimentoId: `m${++n}`, cardId, funil: 'Leads', deEtapa: '', paraEtapa: para, quando, por: 'Ewerton', motivo: '', valor: 0, ...over,
  });
  const vazio = { leadsFb: [], dealsLeads: [] as Deal[] };

  test('ganho, saiu e voltou conta uma vez', () => {
    const r = resumoMes({ mes: '2026-11', ...vazio, movimentos: [
      mov('A', 'Fechado', '2026-11-03T10:00:00Z'), mov('A', 'Negociando', '2026-11-04T10:00:00Z'), mov('A', 'Fechado', '2026-11-05T10:00:00Z'),
    ] });
    expect(r.ganhos).toBe(1);
  });
  test('ganho que saiu não conta', () => {
    const r = resumoMes({ mes: '2026-11', ...vazio, movimentos: [
      mov('B', 'Ganho', '2026-11-03T10:00:00Z', { funil: 'Facebook Lead Ads' }),
      mov('B', 'Negociação', '2026-11-04T10:00:00Z', { funil: 'Facebook Lead Ads' }),
    ] });
    expect(r.ganhos).toBe(0);
  });
  test('perdido por motivo e etapa, com valor', () => {
    const r = resumoMes({ mes: '2026-11', ...vazio, movimentos: [
      mov('C', 'Perdido', '2026-11-10T10:00:00Z', { deEtapa: 'Proposta Enviada', motivo: 'Sem orçamento', valor: 500000 }),
      mov('D', 'Perdido', '2026-10-10T10:00:00Z', { deEtapa: 'Novo Lead', motivo: 'Sem resposta' }),
    ] });
    expect(r.perdidos).toBe(1);
    expect(r.porMotivo[0]).toEqual({ motivo: 'Sem orçamento', qtd: 1, valor: 500000 });
    expect(r.porEtapa[0].etapa).toBe('Proposta Enviada');
  });
  test('conversão', () => {
    const r = resumoMes({ mes: '2026-11', ...vazio, movimentos: [
      mov('E', 'Fechado', '2026-11-02T10:00:00Z'), mov('F', 'Perdido', '2026-11-02T10:00:00Z', { motivo: 'Sem resposta' }),
    ] });
    expect(r.conversao).toBe(0.5);
    expect(resumoMes({ mes: '2026-11', ...vazio, movimentos: [] }).conversao).toBeNull();
  });
  test('alerta de Outro acima de 20%', () => {
    const ms = ['Outro', 'Outro', 'Sem resposta', 'Sem resposta', 'Sem orçamento'].map((m, i) =>
      mov(`P${i}`, 'Perdido', '2026-11-02T10:00:00Z', { motivo: m }),
    );
    expect(resumoMes({ mes: '2026-11', ...vazio, movimentos: ms }).alertaOutro).toBe(true);
  });
  test('entraram ignora teste e soma deals do funil Leads', () => {
    const leadsFb = [
      normalizarLead({ id: 'l1', chegouEm: '2026-11-05T12:00:00Z' }),
      normalizarLead({ id: 'l2', chegouEm: '2026-11-05T12:00:00Z', teste: true }),
      normalizarLead({ id: 'l3', chegouEm: '2026-10-05T12:00:00Z' }),
    ];
    const deal = (id: string, funil: string, createdAt: string) => ({ id, funil, createdAt }) as Deal;
    const r = resumoMes({ mes: '2026-11', leadsFb, movimentos: [], dealsLeads: [
      deal('d1', 'Leads', '2026-11-20T12:00:00Z'), deal('d2', '', '2026-11-21T12:00:00Z'), deal('d3', 'Avulsos', '2026-11-21T12:00:00Z'),
    ] });
    expect(r.entraram).toBe(3);
  });
  test('desde', () => {
    const r = resumoMes({ mes: '2026-11', ...vazio, movimentos: [mov('G', 'Perdido', '2026-11-17T15:00:00Z')] });
    expect(r.desde).toBe('17/11/2026');
  });
});

test('contrato cancelado também zera o valor único', () => {
  const c = { ...uni, encerradoEm: '2026-11' };
  expect(receitaDoMes([c], '2026-11').total).toBe(0);
  expect(garantidoDepois([c], '2026-10')).toBe(0);
  expect(terminaEm(c)).toBe('');
  expect(receitaDoMes([{ ...uni, encerradoEm: '2026-12' }], '2026-11').unico).toBe(350000);
});
