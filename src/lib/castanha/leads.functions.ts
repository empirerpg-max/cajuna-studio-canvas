import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { ETAPAS_FB, MOTIVOS_PERDA, normalizarLead, type FbLead } from './fb-leads';
import { requireAdmin } from './auth.server';
import { chamarScriptLeads } from './apps-script.server';

export const listarLeadsFb = createServerFn({ method: 'POST' }).handler(async (): Promise<{ leads: FbLead[] }> => {
  await requireAdmin();
  const json = await chamarScriptLeads({ action: 'listar' });
  return { leads: (Array.isArray(json.leads) ? json.leads : []).map(normalizarLead) };
});

const textoLongo = z.string().max(5000);

const atualizarSchema = z.object({
  id: z.string().trim().min(1).max(200),
  campos: z
    .object({
      etapa: z.enum(ETAPAS_FB),
      responsavel: textoLongo,
      proximoPasso: textoLongo,
      dataProximoPasso: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]),
      motivoPerda: z.union([z.enum(MOTIVOS_PERDA), z.literal('')]),
      anotacoes: textoLongo,
    })
    .partial(),
});

export const atualizarLeadFb = createServerFn({ method: 'POST' })
  .inputValidator(atualizarSchema)
  .handler(async ({ data }): Promise<{ lead: Partial<FbLead> }> => {
    const sessao = await requireAdmin();
    const json = await chamarScriptLeads({
      action: 'atualizar',
      id: data.id,
      campos: data.campos,
      usuario: sessao.nome,
    });
    return { lead: json.lead ?? {} };
  });
