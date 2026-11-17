import { test, expect, describe } from 'bun:test';
import { criarAmbiente } from './gs/fake-sheets';

const cliente = { nome: 'Mirtes Melo', whatsapp: '+5568999852899', negocio: 'Confeitaria', origem: 'Facebook Lead Ads', cardId: 'l:1', funil: 'Facebook Lead Ads' };
const contrato = { servico: 'Redes sociais', valorMensal: 120000, meses: 4, inicio: '2026-12', valorUnico: 0, mesValorUnico: '', obs: '' };

describe('script do Castanha', () => {
  test('sem token não autoriza', () => {
    const { doPost } = criarAmbiente();
    const r = JSON.parse(doPost({ postData: { contents: JSON.stringify({ action: 'dados', token: 'x' }) } }).texto);
    expect(r.erro).toBe('nao_autorizado');
  });

  test('registrarGanho cria cliente, contrato e movimento; repetir reaproveita o cliente', () => {
    const { chamar } = criarAmbiente();
    const mov = { cardId: 'l:1', funil: 'Facebook Lead Ads', deEtapa: 'Negociação', paraEtapa: 'Ganho', motivo: '', valor: 0 };
    expect(chamar({ action: 'registrarGanho', cliente, contrato, movimento: mov }).ok).toBe(true);
    let d = chamar({ action: 'dados' });
    expect(d.clientes.length).toBe(1);
    expect(d.contratos[0].valorMensal).toBe(120000);
    expect(d.contratos[0].meses).toBe(4);
    expect(d.contratos[0].clienteId).toBe(d.clientes[0].clienteId);
    expect(d.contratos[0].criadoPor).toBe('Ewerton');
    expect(d.movimentos.length).toBe(1);
    chamar({ action: 'registrarGanho', cliente, contrato: null, movimento: null });
    d = chamar({ action: 'dados' });
    expect(d.clientes.length).toBe(1);
    expect(d.contratos.length).toBe(1);
  });

  test('atualizar etapa grava movimento; só anotação não grava', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'atualizar', id: 'l:1', campos: { etapa: 'Em conversa' } });
    chamar({ action: 'atualizar', id: 'l:1', campos: { anotacoes: 'ligar amanhã' } });
    const d = chamar({ action: 'dados' });
    expect(d.movimentos.length).toBe(1);
    expect(d.movimentos[0]).toMatchObject({ cardId: 'l:1', funil: 'Facebook Lead Ads', deEtapa: 'Novo', paraEtapa: 'Em conversa', por: 'Ewerton' });
  });

  test('atualizar para Perdido grava o motivo no movimento', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'atualizar', id: 'l:1', campos: { etapa: 'Perdido', motivoPerda: 'Sem orçamento' } });
    expect(chamar({ action: 'dados' }).movimentos[0].motivo).toBe('Sem orçamento');
  });

  test('registrarMovimento ignora mesma etapa', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'registrarMovimento', movimento: { cardId: 'd1', funil: 'Leads', deEtapa: 'Novo Lead', paraEtapa: 'Novo Lead', motivo: '', valor: 0 } });
    chamar({ action: 'registrarMovimento', movimento: { cardId: 'd1', funil: 'Leads', deEtapa: 'Novo Lead', paraEtapa: 'Perdido', motivo: 'Sem resposta', valor: 50000 } });
    const d = chamar({ action: 'dados' });
    expect(d.movimentos.length).toBe(1);
    expect(d.movimentos[0].valor).toBe(50000);
  });

  test('mudarValorContrato encerra o antigo e cria o restante', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'registrarGanho', cliente, contrato, movimento: null });
    const id = chamar({ action: 'dados' }).contratos[0].contratoId;
    const r = chamar({ action: 'mudarValorContrato', contratoId: id, aPartirDe: '2027-02', valorMensal: 150000 });
    expect(r.ok).toBe(true);
    const cs = chamar({ action: 'dados' }).contratos;
    expect(cs.length).toBe(2);
    expect(cs[0].encerradoEm).toBe('2027-02');
    expect(cs[1]).toMatchObject({ inicio: '2027-02', meses: 2, valorMensal: 150000 });
  });

  test('mudarValorContrato mantém o valor único que vem depois do reajuste', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'registrarGanho', cliente, contrato: { ...contrato, meses: 8, valorUnico: 300000, mesValorUnico: '2027-06' }, movimento: null });
    const id = chamar({ action: 'dados' }).contratos[0].contratoId;
    chamar({ action: 'mudarValorContrato', contratoId: id, aPartirDe: '2027-02', valorMensal: 150000 });
    const cs = chamar({ action: 'dados' }).contratos;
    const unicos = cs.filter((c: { valorUnico: number; mesValorUnico: string; encerradoEm: string }) => c.valorUnico === 300000 && c.mesValorUnico === '2027-06' && !(c.encerradoEm && c.encerradoEm <= '2027-06'));
    expect(unicos.length).toBe(1);
  });

  test('mudarValorContrato no início é recusado', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'registrarGanho', cliente, contrato, movimento: null });
    const id = chamar({ action: 'dados' }).contratos[0].contratoId;
    expect(chamar({ action: 'mudarValorContrato', contratoId: id, aPartirDe: '2026-12', valorMensal: 1 }).ok).toBe(false);
  });

  test('cancelarContrato encerra no início', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'registrarGanho', cliente, contrato: { ...contrato, valorUnico: 50000, mesValorUnico: '2026-11' }, movimento: null });
    const id = chamar({ action: 'dados' }).contratos[0].contratoId;
    chamar({ action: 'cancelarContrato', contratoId: id });
    expect(chamar({ action: 'dados' }).contratos[0].encerradoEm).toBe('2026-11');
  });

  test('salvarCliente manual e edição', () => {
    const { chamar } = criarAmbiente();
    const r = chamar({ action: 'salvarCliente', cliente: { nome: 'Studio Maré', whatsapp: '', negocio: '', origem: 'Manual', cardId: '', funil: '' } });
    expect(r.cliente.clienteId).toMatch(/^cli_/);
    chamar({ action: 'salvarCliente', cliente: { ...r.cliente, nome: 'Studio Maré Ltda' } });
    const d = chamar({ action: 'dados' });
    expect(d.clientes.length).toBe(1);
    expect(d.clientes[0].nome).toBe('Studio Maré Ltda');
  });

  test('salvarContrato exige cliente existente', () => {
    const { chamar } = criarAmbiente();
    expect(chamar({ action: 'salvarContrato', contrato: { ...contrato, clienteId: 'cli_x' } }).ok).toBe(false);
  });

  test('config: chave desconhecida recusada; valor salvo volta', () => {
    const { chamar } = criarAmbiente();
    expect(chamar({ action: 'salvarConfig', chave: 'x', valor: 'y' }).ok).toBe(false);
    chamar({ action: 'salvarConfig', chave: 'mensagem_whatsapp', valor: 'Oi {nome}' });
    chamar({ action: 'salvarConfig', chave: 'mensagem_whatsapp', valor: 'Olá {nome}' });
    expect(chamar({ action: 'config' }).config).toEqual({ mensagem_whatsapp: 'Olá {nome}' });
  });

  test('telefone com + volta sem o apóstrofo de proteção', () => {
    const { chamar } = criarAmbiente();
    chamar({ action: 'salvarCliente', cliente: { nome: 'Mirtes', whatsapp: '+5568999852899', negocio: '', origem: 'Manual', cardId: '', funil: '' } });
    expect(chamar({ action: 'dados' }).clientes[0].whatsapp).toBe('+5568999852899');
  });

  test('texto começando com = não vira fórmula', () => {
    const { chamar, aba } = criarAmbiente();
    chamar({ action: 'salvarCliente', cliente: { nome: '=IMPORTXML("x")', whatsapp: '', negocio: '', origem: 'Manual', cardId: '', funil: '' } });
    expect(String(aba('Clientes').data[1][1]).startsWith("'=")).toBe(true);
  });
});
