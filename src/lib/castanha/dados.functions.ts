import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAdmin } from './auth.server';
import { chamarScriptLeads } from './apps-script.server';
import { validarContrato, type Cliente, type Contrato, type DadosCastanha, type Movimento } from './negocio';

const texto = z.string().max(2000);
const mes = z.union([z.string().regex(/^\d{4}-\d{2}$/), z.literal('')]);
const centavos = z.number().int().min(0).max(1e10);

const clienteSchema = z.object({
  clienteId: z.string().max(100).optional(),
  nome: z.string().trim().min(1, 'Informe o nome do cliente.').max(200),
  whatsapp: texto.optional().default(''),
  negocio: texto.optional().default(''),
  origem: z.enum(['Facebook Lead Ads', 'Leads', 'Manual']).optional().default('Manual'),
  cardId: z.string().max(200).optional().default(''),
  funil: z.string().max(100).optional().default(''),
  obs: texto.optional().default(''),
});

const contratoSchema = z.object({
  contratoId: z.string().max(100).optional(),
  clienteId: z.string().max(100).optional().default(''),
  servico: z.string().trim().max(200),
  valorMensal: centavos,
  meses: z.number().int().min(0).max(60),
  inicio: mes,
  valorUnico: centavos,
  mesValorUnico: mes,
  encerradoEm: mes.optional(),
  obs: texto.optional().default(''),
});

const movimentoSchema = z.object({
  cardId: z.string().trim().min(1).max(200),
  funil: z.string().max(100),
  deEtapa: z.string().max(100),
  paraEtapa: z.string().trim().min(1).max(100),
  motivo: z.string().max(200).optional().default(''),
  valor: centavos.optional().default(0),
});

function checarContrato(c: z.infer<typeof contratoSchema>) {
  const erro = validarContrato(c);
  if (erro) throw new Error(erro);
}

const num = (v: unknown) => Number(v) || 0;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function paraCliente(r: Record<string, unknown>): Cliente {
  return {
    clienteId: str(r.clienteId), nome: str(r.nome), whatsapp: str(r.whatsapp), negocio: str(r.negocio),
    origem: (['Facebook Lead Ads', 'Leads', 'Manual'].includes(str(r.origem)) ? str(r.origem) : 'Manual') as Cliente['origem'],
    cardId: str(r.cardId), funil: str(r.funil), criadoEm: str(r.criadoEm), criadoPor: str(r.criadoPor), obs: str(r.obs),
  };
}

function paraContrato(r: Record<string, unknown>): Contrato {
  return {
    contratoId: str(r.contratoId), clienteId: str(r.clienteId), servico: str(r.servico), valorMensal: num(r.valorMensal),
    meses: num(r.meses), inicio: str(r.inicio), valorUnico: num(r.valorUnico), mesValorUnico: str(r.mesValorUnico),
    encerradoEm: str(r.encerradoEm), criadoEm: str(r.criadoEm), criadoPor: str(r.criadoPor), obs: str(r.obs),
  };
}

function paraMovimento(r: Record<string, unknown>): Movimento {
  return {
    movimentoId: str(r.movimentoId), cardId: str(r.cardId), funil: str(r.funil), deEtapa: str(r.deEtapa),
    paraEtapa: str(r.paraEtapa), quando: str(r.quando), por: str(r.por), motivo: str(r.motivo), valor: num(r.valor),
  };
}

const lista = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

async function comSessao<T>(fn: (usuario: string) => Promise<T>): Promise<T> {
  const sessao = await requireAdmin();
  return fn(sessao.nome);
}

export const listarDados = createServerFn({ method: 'POST' }).handler(
  (): Promise<DadosCastanha> =>
    comSessao(async () => {
      const j = await chamarScriptLeads({ action: 'dados' });
      return {
        clientes: lista(j.clientes).map(paraCliente),
        contratos: lista(j.contratos).map(paraContrato),
        movimentos: lista(j.movimentos).map(paraMovimento),
      };
    }),
);

export const registrarGanho = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ cliente: clienteSchema, contrato: contratoSchema.nullable(), movimento: movimentoSchema.nullable() }))
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      if (data.contrato) checarContrato(data.contrato);
      const j = await chamarScriptLeads({ action: 'registrarGanho', usuario, ...data });
      return {
        cliente: paraCliente((j.cliente ?? {}) as Record<string, unknown>),
        contrato: j.contrato ? paraContrato(j.contrato as Record<string, unknown>) : null,
      };
    }),
  );

export const salvarCliente = createServerFn({ method: 'POST' })
  .inputValidator(clienteSchema)
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      const j = await chamarScriptLeads({ action: 'salvarCliente', usuario, cliente: data });
      return paraCliente((j.cliente ?? {}) as Record<string, unknown>);
    }),
  );

export const salvarContrato = createServerFn({ method: 'POST' })
  .inputValidator(contratoSchema)
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      checarContrato(data);
      const j = await chamarScriptLeads({ action: 'salvarContrato', usuario, contrato: data });
      return paraContrato((j.contrato ?? {}) as Record<string, unknown>);
    }),
  );

export const cancelarContrato = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ contratoId: z.string().min(1).max(100) }))
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      await chamarScriptLeads({ action: 'cancelarContrato', usuario, contratoId: data.contratoId });
      return { ok: true };
    }),
  );

export const mudarValorContrato = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ contratoId: z.string().min(1).max(100), aPartirDe: z.string().regex(/^\d{4}-\d{2}$/), valorMensal: centavos.min(1) }))
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      await chamarScriptLeads({ action: 'mudarValorContrato', usuario, ...data });
      return { ok: true };
    }),
  );

export const registrarMovimento = createServerFn({ method: 'POST' })
  .inputValidator(movimentoSchema)
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      await chamarScriptLeads({ action: 'registrarMovimento', usuario, movimento: data });
      return { ok: true };
    }),
  );

export const CHAVES_MENSAGEM = ['mensagem_whatsapp', 'mensagem_whatsapp_clientes'] as const;

export const lerConfig = createServerFn({ method: 'POST' }).handler(
  (): Promise<Record<string, string>> =>
    comSessao(async () => {
      const j = await chamarScriptLeads({ action: 'config' });
      const c = (j.config ?? {}) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, str(v)]));
    }),
);

export const salvarConfig = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ chave: z.enum(CHAVES_MENSAGEM), valor: z.string().max(1000) }))
  .handler(({ data }) =>
    comSessao(async (usuario) => {
      await chamarScriptLeads({ action: 'salvarConfig', usuario, chave: data.chave, valor: data.valor });
      return { ok: true };
    }),
  );
