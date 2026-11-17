import { test, expect, describe } from 'bun:test';
import {
  whatsappLink,
  tempoDesde,
  novoAtrasado,
  proximoPassoVencido,
  validarCampos,
  aplicarCampos,
  normalizarLead,
  filtrarLeads,
  resumoFb,
  type FbLead,
  type FiltrosFb,
} from '@/lib/castanha/fb-leads';

const NOW = Date.parse('2026-11-17T15:00:00Z');
const MIN = 60_000;
const H = 60 * MIN;
const DIA = 24 * H;
const iso = (ms: number) => new Date(ms).toISOString();

function lead(over: Partial<FbLead> = {}): FbLead {
  return { ...normalizarLead({ id: 'l:1', nome: 'Fulano', chegouEm: iso(NOW - H) }), ...over };
}

const FILTROS: FiltrosFb = { busca: '', campanha: '', responsavel: '', mostrarTeste: false, verTodosFechados: false };

describe('whatsappLink', () => {
  test('com +55 e máscara', () => expect(whatsappLink('+55 (85) 99999-0000')).toBe('https://wa.me/5585999990000'));
  test('celular sem DDI ganha 55', () => expect(whatsappLink('85999990000')).toBe('https://wa.me/5585999990000'));
  test('fixo sem DDI ganha 55', () => expect(whatsappLink('8533330000')).toBe('https://wa.me/558533330000'));
  test('lead de teste não tem link', () =>
    expect(whatsappLink('<test lead: dummy data for whatsapp_number>')).toBeNull());
  test('curto demais', () => expect(whatsappLink('123')).toBeNull());
});

describe('tempoDesde', () => {
  test('vazio ou inválido', () => {
    expect(tempoDesde('', NOW)).toBe('—');
    expect(tempoDesde('xx', NOW)).toBe('—');
  });
  test('agora', () => expect(tempoDesde(iso(NOW - 30_000), NOW)).toBe('agora'));
  test('minutos', () => expect(tempoDesde(iso(NOW - 5 * MIN), NOW)).toBe('há 5 min'));
  test('horas', () => expect(tempoDesde(iso(NOW - 2 * H), NOW)).toBe('há 2h'));
  test('dias', () => expect(tempoDesde(iso(NOW - 3 * DIA), NOW)).toBe('há 3 dias'));
  test('um dia', () => expect(tempoDesde(iso(NOW - DIA), NOW)).toBe('há 1 dia'));
});

describe('novoAtrasado', () => {
  test('Novo há 61 min', () => expect(novoAtrasado(lead({ chegouEm: iso(NOW - 61 * MIN) }), NOW)).toBe(true));
  test('Novo há 59 min', () => expect(novoAtrasado(lead({ chegouEm: iso(NOW - 59 * MIN) }), NOW)).toBe(false));
  test('Em conversa há 3h', () =>
    expect(novoAtrasado(lead({ etapa: 'Em conversa', chegouEm: iso(NOW - 3 * H) }), NOW)).toBe(false));
});

describe('proximoPassoVencido', () => {
  test('data passada', () => expect(proximoPassoVencido(lead({ dataProximoPasso: '2026-11-16' }), '2026-11-17')).toBe(true));
  test('hoje não', () => expect(proximoPassoVencido(lead({ dataProximoPasso: '2026-11-17' }), '2026-11-17')).toBe(false));
  test('vazio não', () => expect(proximoPassoVencido(lead(), '2026-11-17')).toBe(false));
  test('Ganho não', () =>
    expect(proximoPassoVencido(lead({ etapa: 'Ganho', dataProximoPasso: '2026-11-16' }), '2026-11-17')).toBe(false));
});

describe('validarCampos', () => {
  test('Perdido sem motivo', () =>
    expect(validarCampos(lead(), { etapa: 'Perdido' })).toBe('Informe o motivo da perda.'));
  test('Perdido com motivo', () =>
    expect(validarCampos(lead(), { etapa: 'Perdido', motivoPerda: 'Sem resposta' })).toBeNull());
});

test('aplicarCampos limpa motivo ao sair de Perdido', () => {
  const r = aplicarCampos(lead({ etapa: 'Perdido', motivoPerda: 'Sem resposta' }), { etapa: 'Em conversa' });
  expect(r.lead.motivoPerda).toBe('');
  expect(r.lead.etapa).toBe('Em conversa');
  expect(r.enviar).toEqual({ etapa: 'Em conversa', motivoPerda: '' });
});

test('normalizarLead', () => {
  const l = normalizarLead({ id: 1, etapa: 'xyz', teste: 'true' });
  expect(l.id).toBe('1');
  expect(l.etapa).toBe('Novo');
  expect(l.teste).toBe(false);
  expect(l.outras).toEqual({});
  expect(l.nome).toBe('');
});

describe('filtrarLeads', () => {
  const maria = lead({ id: 'a', nome: 'Maria Souza', whatsapp: '+55 85 99999-1234' });
  const teste = lead({ id: 'b', teste: true });
  const ganhoAntigo = lead({ id: 'c', etapa: 'Ganho', atualizadoEm: iso(NOW - 40 * DIA) });
  const todos = [maria, teste, ganhoAntigo];

  test('teste escondido por padrão', () => expect(filtrarLeads(todos, FILTROS, NOW).map((l) => l.id)).not.toContain('b'));
  test('mostrar teste', () =>
    expect(filtrarLeads(todos, { ...FILTROS, mostrarTeste: true }, NOW).map((l) => l.id)).toContain('b'));
  test('busca por nome sem acento/maiúscula', () =>
    expect(filtrarLeads(todos, { ...FILTROS, busca: 'maria' }, NOW).map((l) => l.id)).toEqual(['a']));
  test('busca por WhatsApp', () =>
    expect(filtrarLeads(todos, { ...FILTROS, busca: '9999' }, NOW).map((l) => l.id)).toEqual(['a']));
  test('fechado antigo some', () => expect(filtrarLeads(todos, FILTROS, NOW).map((l) => l.id)).not.toContain('c'));
  test('ver todos fechados', () =>
    expect(filtrarLeads(todos, { ...FILTROS, verTodosFechados: true }, NOW).map((l) => l.id)).toContain('c'));
});

describe('resumoFb', () => {
  test('ignora teste e sem fechados', () => {
    const r = resumoFb([lead({ teste: true }), lead({ id: 'x' })], NOW);
    expect(r.porEtapa.Novo).toBe(1);
    expect(r.novos7d).toBe(1);
    expect(r.taxaGanho).toBeNull();
  });
  test('taxa de ganho', () => {
    const r = resumoFb([lead({ etapa: 'Ganho' }), lead({ id: 'y', etapa: 'Perdido' })], NOW);
    expect(r.taxaGanho).toBe(0.5);
  });
  test('novos atrasados', () => {
    const r = resumoFb([lead({ chegouEm: iso(NOW - 2 * H) })], NOW);
    expect(r.novosAtrasados).toBe(1);
  });
});

import { hojeISO } from '@/lib/castanha/fb-leads';
test('hojeISO usa o fuso de Fortaleza', () => {
  expect(hojeISO(Date.parse('2026-11-18T01:30:00Z'))).toBe('2026-11-17');
  expect(hojeISO(Date.parse('2026-11-18T04:00:00Z'))).toBe('2026-11-18');
});
