import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminOption } from '@/lib/crm-types';
import {
  ETAPAS_FB,
  aplicarCampos,
  filtrarLeads,
  hojeISO,
  mesclarSalvo,
  tempoDesde,
  type CamposEditaveis,
  type FbLead,
  type FiltrosFb,
} from '@/lib/castanha/fb-leads';
import { atualizarLeadFb, listarLeadsFb } from '@/lib/castanha/leads.functions';
import { FbLeadCard } from './FbLeadCard';
import { FbLeadDetail } from './FbLeadDetail';

export const FB_LEADS_QUERY_KEY = ['fb-leads'] as const;

const COR_ETAPA: Record<string, string> = {
  Novo: '#E97933',
  Ganho: '#1E8E3E',
  Perdido: '#9AA0A6',
};

const FILTROS_INICIAIS: FiltrosFb = {
  busca: '',
  campanha: '',
  responsavel: '',
  mostrarTeste: false,
  verTodosFechados: false,
};

function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function FbLeadsBoard({
  admins,
  onNaoAutenticado,
}: {
  admins: AdminOption[];
  onNaoAutenticado: () => void;
}) {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<FiltrosFb>(FILTROS_INICIAIS);
  const [detalhe, setDetalhe] = useState<{ id: string; etapaInicial?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const query = useQuery({
    queryKey: FB_LEADS_QUERY_KEY,
    queryFn: () => listarLeadsFb(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const erro = query.error ? mensagemErro(query.error) : '';
  useEffect(() => {
    if (erro.includes('NAO_AUTENTICADO')) onNaoAutenticado();
  }, [erro, onNaoAutenticado]);

  const leads = useMemo(() => query.data?.leads ?? [], [query.data]);
  const visiveis = useMemo(() => filtrarLeads(leads, filtros, now), [leads, filtros, now]);
  const campanhas = useMemo(() => [...new Set(leads.map((l) => l.campanha).filter(Boolean))].sort(), [leads]);
  const responsaveis = useMemo(
    () => [...new Set([...admins.map((a) => a.nome), ...leads.map((l) => l.responsavel)].filter(Boolean))].sort(),
    [admins, leads],
  );
  const porEtapa = useMemo(() => {
    const map = Object.fromEntries(ETAPAS_FB.map((e) => [e, [] as FbLead[]]));
    visiveis.forEach((l) => map[l.etapa]?.push(l));
    return map;
  }, [visiveis]);
  const hoje = hojeISO(now);
  const leadDetalhe = detalhe ? leads.find((l) => l.id === detalhe.id) : undefined;

  function trocarLead(id: string, fn: (l: FbLead) => FbLead) {
    queryClient.setQueryData<{ leads: FbLead[] }>(FB_LEADS_QUERY_KEY, (old) =>
      old ? { leads: old.leads.map((l) => (l.id === id ? fn(l) : l)) } : old,
    );
  }

  async function salvar(lead: FbLead, campos: CamposEditaveis) {
    const { lead: novo, enviar } = aplicarCampos(lead, campos);
    await queryClient.cancelQueries({ queryKey: FB_LEADS_QUERY_KEY });
    trocarLead(lead.id, () => novo);
    setSaving(true);
    try {
      const res = await atualizarLeadFb({ data: { id: lead.id, campos: enviar } });
      trocarLead(lead.id, (l) => mesclarSalvo(l, novo, res.lead));
      setDetalhe(null);
    } catch (err) {
      trocarLead(lead.id, () => lead);
      const msg = mensagemErro(err);
      if (msg.includes('NAO_AUTENTICADO')) onNaoAutenticado();
      else toast.error(`Não foi possível salvar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function soltar(etapa: string, id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.etapa === etapa) return;
    if (etapa === 'Perdido') setDetalhe({ id, etapaInicial: 'Perdido' });
    else void salvar(lead, { etapa });
  }

  const set = <K extends keyof FiltrosFb>(k: K, v: FiltrosFb[K]) => setFiltros((f) => ({ ...f, [k]: v }));
  const selectCls =
    'rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#E97933]';

  return (
    <div className="px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">Facebook Lead Ads</h2>
            <p className="text-sm font-medium text-[#1A1A1A]/50">
              {visiveis.length} lead{visiveis.length === 1 ? '' : 's'}
              {query.dataUpdatedAt > 0 && <> · atualizado {tempoDesde(new Date(query.dataUpdatedAt).toISOString(), now)}</>}
              {saving && <span className="ml-2 text-[#E97933]">salvando...</span>}
            </p>
          </div>
          <button
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-black text-[#1A1A1A] transition hover:bg-[#F0EAE3] disabled:opacity-60"
          >
            <RefreshCw size={15} className={cn(query.isFetching && 'animate-spin')} /> Atualizar
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35" />
            <input
              value={filtros.busca}
              onChange={(e) => set('busca', e.target.value)}
              placeholder="Buscar nome ou WhatsApp"
              aria-label="Buscar nome ou WhatsApp"
              className={cn(selectCls, 'w-full pl-9')}
            />
          </label>
          <select
            value={filtros.campanha}
            onChange={(e) => set('campanha', e.target.value)}
            aria-label="Campanha"
            className={selectCls}
          >
            <option value="">Todas as campanhas</option>
            {campanhas.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={filtros.responsavel}
            onChange={(e) => set('responsavel', e.target.value)}
            aria-label="Responsável"
            className={selectCls}
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]/60">
            <input
              type="checkbox"
              checked={filtros.mostrarTeste}
              onChange={(e) => set('mostrarTeste', e.target.checked)}
              className="accent-[#E97933]"
            />
            Leads de teste
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]/60">
            <input
              type="checkbox"
              checked={filtros.verTodosFechados}
              onChange={(e) => set('verTodosFechados', e.target.checked)}
              className="accent-[#E97933]"
            />
            Fechados antigos
          </label>
        </div>

        {query.isLoading ? (
          <div className="flex items-center justify-center py-24 text-[#1A1A1A]/40">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : erro && !query.data ? (
          <div className="mx-auto max-w-lg rounded-3xl border-2 border-[#1A1A1A] bg-white p-6 text-center">
            <p className="font-black text-[#1A1A1A]">Não foi possível carregar os leads</p>
            <p className="mt-1 text-sm text-[#1A1A1A]/60 break-words">{erro}</p>
            <button
              onClick={() => void query.refetch()}
              className="mt-4 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2 font-black text-[#1A1A1A]"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0">
            {ETAPAS_FB.map((etapa) => (
              <div
                key={etapa}
                className="w-[85vw] shrink-0 snap-start rounded-2xl border-2 border-[#1A1A1A]/10 bg-[#F0EAE3] p-3 sm:w-72"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) soltar(etapa, id);
                }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-2 text-sm font-black leading-tight text-[#1A1A1A]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_ETAPA[etapa] ?? '#2D5F8A' }} />
                    {etapa}
                  </h3>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1A1A1A]/50">
                    {porEtapa[etapa].length}
                  </span>
                </div>
                <div className="flex min-h-[60px] flex-col gap-3">
                  {porEtapa[etapa].map((lead) => (
                    <FbLeadCard key={lead.id} lead={lead} now={now} hoje={hoje} onOpen={(l) => setDetalhe({ id: l.id })} />
                  ))}
                  {porEtapa[etapa].length === 0 && (
                    <p className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/10 py-4 text-center text-xs font-bold text-[#1A1A1A]/30">
                      Nenhum lead aqui
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {leadDetalhe && (
        <FbLeadDetail
          key={`${leadDetalhe.id}-${detalhe?.etapaInicial ?? ''}`}
          lead={leadDetalhe}
          admins={admins}
          etapaInicial={detalhe?.etapaInicial}
          saving={saving}
          onSave={(campos) => void salvar(leadDetalhe, campos)}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  );
}
