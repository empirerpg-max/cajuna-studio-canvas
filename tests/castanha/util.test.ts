import { test, expect, describe } from 'bun:test';
import {
  parseCentavos,
  formatBRL,
  mesISO,
  somarMeses,
  diffMeses,
  nomeMes,
  plural,
  MENSAGEM_PADRAO,
  MENSAGEM_PADRAO_CLIENTES,
  montarMensagem,
} from '@/lib/castanha/util';
import { whatsappLink } from '@/lib/castanha/fb-leads';

const semNbsp = (s: string) => s.replace(/ /g, ' ');

describe('parseCentavos', () => {
  test('com vírgula decimal', () => expect(parseCentavos('1.200,50')).toBe(120050));
  test('com R$', () => expect(parseCentavos('R$ 1.200')).toBe(120000));
  test('inteiro', () => expect(parseCentavos('1200')).toBe(120000));
  test('ponto decimal', () => expect(parseCentavos('1200.5')).toBe(120050));
  test('zero é nulo', () => expect(parseCentavos('0')).toBeNull());
  test('texto é nulo', () => expect(parseCentavos('abc')).toBeNull());
  test('vazio é nulo', () => expect(parseCentavos('')).toBeNull());
});

test('formatBRL', () => {
  expect(semNbsp(formatBRL(120050))).toBe('R$ 1.200,50');
  expect(semNbsp(formatBRL(0))).toBe('R$ 0,00');
});

describe('meses', () => {
  test('mesISO no fuso de Fortaleza', () => expect(mesISO(Date.parse('2026-12-01T02:00:00Z'))).toBe('2026-11'));
  test('somar', () => expect(somarMeses('2026-11', 3)).toBe('2027-02'));
  test('subtrair', () => expect(somarMeses('2026-01', -1)).toBe('2025-12'));
  test('diferença', () => expect(diffMeses('2026-11', '2027-02')).toBe(3));
  test('nome curto', () => expect(nomeMes('2026-11')).toBe('nov/26'));
});

test('plural', () => {
  expect(plural(1, 'cartão', 'cartões')).toBe('1 cartão');
  expect(plural(2, 'cartão', 'cartões')).toBe('2 cartões');
  expect(plural(0, 'cartão', 'cartões')).toBe('0 cartões');
});

describe('montarMensagem', () => {
  const vars = { nome: 'MIRTES MELO', admin: 'Ewerton', precisa: 'identidade visual', negocio: '' };
  test('modelo de prospecção completo', () =>
    expect(montarMensagem(MENSAGEM_PADRAO, vars)).toBe(
      'Oi, Mirtes! Aqui é Ewerton, da Cajuna Studio 🧡 Vi que você pediu um orçamento de identidade visual. Posso te fazer umas perguntinhas rápidas?',
    ));
  test('sem o que precisa, o trecho some', () =>
    expect(montarMensagem(MENSAGEM_PADRAO, { ...vars, precisa: '' })).toBe(
      'Oi, Mirtes! Aqui é Ewerton, da Cajuna Studio 🧡 Vi que você pediu um orçamento. Posso te fazer umas perguntinhas rápidas?',
    ));
  test('texto de lead de teste conta como vazio', () =>
    expect(montarMensagem(MENSAGEM_PADRAO, { ...vars, precisa: '<test lead: dummy data>' })).toBe(
      montarMensagem(MENSAGEM_PADRAO, { ...vars, precisa: '' }),
    ));
  test('modelo de clientes', () =>
    expect(montarMensagem(MENSAGEM_PADRAO_CLIENTES, vars)).toBe('Oi, Mirtes! Aqui é Ewerton, da Cajuna Studio 🧡 Tudo bem por aí?'));
  test('nunca sobra chave nem colchete', () => {
    const r = montarMensagem('Oi {nome}[, do {negocio}]! {desconhecida}', { ...vars, nome: '' });
    expect(r).not.toMatch(/[{}[\]]/);
  });
});

test('whatsappLink com mensagem', () =>
  expect(whatsappLink('+5568999852899', 'Oi, a&b')).toBe('https://wa.me/5568999852899?text=Oi%2C%20a%26b'));
