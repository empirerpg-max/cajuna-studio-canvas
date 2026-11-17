import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Deal } from '@/lib/crm-types';
import type { FbLead } from '@/lib/castanha/fb-leads';
import { garantidoDepois, receitaDoMes, resumoMes, serieReceita, type DadosCastanha } from '@/lib/castanha/negocio';
import { formatBRL, mesISO, nomeMes, plural, somarMeses } from '@/lib/castanha/util';
import { GraficoReceita } from './GraficoReceita';

const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesLongo = (m: string) => {
  const nome = MESES_LONGOS[Number(m.slice(5, 7)) - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${m.slice(0, 4)}`;
};

function Variacao({ atual, anterior, invertida = false, sufixo = '' }: { atual: number; anterior: number; invertida?: boolean; sufixo?: string }) {
  const d = Math.round(atual - anterior);
  if (d === 0) return <span className="text-xs font-bold text-[#1A1A1A]/40">igual ao mês anterior</span>;
  const bom = invertida ? d < 0 : d > 0;
  return (
    <span className={cn('text-xs font-black', bom ? 'text-[#1E8E3E]' : 'text-[#B3261E]')}>
      {d > 0 ? '↑' : '↓'} {Math.abs(d)}
      {sufixo} vs mês anterior
    </span>
  );
}

function Numero({ rotulo, valor, rodape, destaque }: { rotulo: string; valor: ReactNode; rodape?: ReactNode; destaque?: boolean }) {
  return (
    <div className={cn('rounded-3xl border-2 border-[#1A1A1A] p-4 sm:p-5', destaque ? 'bg-[#E97933]' : 'bg-white')}>
      <p className={cn('text-sm font-black', destaque ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/55')}>{rotulo}</p>
      <p className="mt-1 text-4xl font-black tabular-nums leading-none text-[#1A1A1A]">{valor}</p>
      {rodape && <div className="mt-2">{rodape}</div>}
    </div>
  );
}

export function PainelMes({
  deals,
  leadsFb,
  dados,
  carregando,
}: {
  deals: Deal[];
  leadsFb: FbLead[];
  dados: DadosCastanha | undefined;
  carregando: boolean;
}) {
  const hoje = mesISO(Date.now());
  const [mes, setMes] = useState(hoje);
  const anterior = somarMeses(mes, -1);
  const movimentos = dados?.movimentos ?? [];
  const contratos = dados?.contratos ?? [];

  const r = useMemo(() => resumoMes({ mes, leadsFb, dealsLeads: deals, movimentos }), [mes, leadsFb, deals, movimentos]);
  const rAnt = useMemo(() => resumoMes({ mes: anterior, leadsFb, dealsLeads: deals, movimentos }), [anterior, leadsFb, deals, movimentos]);
  const receita = receitaDoMes(contratos, mes);
  const garantido = garantidoDepois(contratos, mes);
  const serie = useMemo(() => serieReceita(contratos, mes), [contratos, mes]);
  const maxMotivo = Math.max(1, ...r.porMotivo.map((m) => m.qtd));
  const maxEtapa = Math.max(1, ...r.porEtapa.map((e) => e.qtd));

  return (
    <section className="grid min-w-0 gap-5 [&>*]:min-w-0" aria-label="Painel do mês">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMes(anterior)} aria-label="Mês anterior" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white hover:bg-[#F0EAE3]">
            <ChevronLeft size={20} />
          </button>
          <h2 className="min-w-0 text-center text-xl font-black text-[#1A1A1A] sm:min-w-[220px] sm:text-3xl">{mesLongo(mes)}</h2>
          <button onClick={() => setMes(somarMeses(mes, 1))} aria-label="Próximo mês" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white hover:bg-[#F0EAE3]">
            <ChevronRight size={20} />
          </button>
          {mes !== hoje && (
            <button onClick={() => setMes(hoje)} className="ml-1 rounded-full px-3 py-1.5 text-sm font-black text-[#E97933] hover:bg-[#FFF0E6]">
              Hoje
            </button>
          )}
        </div>
        {carregando ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1A1A1A]/45">
            <Loader2 size={14} className="animate-spin" /> carregando…
          </span>
        ) : (
          r.desde && <span className="text-xs font-bold text-[#1A1A1A]/45">Ganhos e perdidos contados desde {r.desde}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Entraram" valor={r.entraram} rodape={<Variacao atual={r.entraram} anterior={rAnt.entraram} />} />
        <Numero destaque rotulo="Ganhos" valor={r.ganhos} rodape={<Variacao atual={r.ganhos} anterior={rAnt.ganhos} />} />
        <Numero rotulo="Perdidos" valor={r.perdidos} rodape={<Variacao atual={r.perdidos} anterior={rAnt.perdidos} invertida />} />
        <Numero
          rotulo="Conversão"
          valor={r.conversao === null ? '—' : `${Math.round(r.conversao * 100)}%`}
          rodape={
            r.conversao !== null && rAnt.conversao !== null ? (
              <Variacao atual={r.conversao * 100} anterior={rAnt.conversao * 100} sufixo=" p.p." />
            ) : (
              <span className="text-xs font-bold text-[#1A1A1A]/40">ganhos ÷ (ganhos + perdidos)</span>
            )
          }
        />
      </div>

      <div className="rounded-3xl border-2 border-[#1A1A1A] bg-white p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-black text-[#1A1A1A]/55">Receita em {nomeMes(mes)}</p>
            <p className="text-3xl font-black tabular-nums text-[#1A1A1A]">{formatBRL(receita.total)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black text-[#1A1A1A]/55">
              <span className="h-3 w-3 rounded-[3px] border-2 border-[#1A1A1A] bg-[#E97933]" /> Mensalidades ativas
            </p>
            <p className="text-2xl font-black tabular-nums text-[#1A1A1A]">{formatBRL(receita.recorrente)}</p>
            {receita.unico > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]/55">
                <span className="h-2.5 w-2.5 rounded-[3px] border-2 border-[#1A1A1A] bg-[#2D5F8A]" /> + {formatBRL(receita.unico)} em valores únicos
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-black text-[#1A1A1A]/55">Já garantido depois de {nomeMes(mes)}</p>
            <p className="text-2xl font-black tabular-nums text-[#2D5F8A]">{formatBRL(garantido)}</p>
          </div>
        </div>
        <div className="mt-4">
          {contratos.length ? (
            <GraficoReceita serie={serie} mesSelecionado={mes} onEscolher={setMes} />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 px-4 py-8 text-center text-sm font-bold text-[#1A1A1A]/45">
              A receita aparece aqui quando o primeiro contrato for registrado (ao mover um card para Ganho ou Fechado, ou na aba Clientes).
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="rounded-3xl border-2 border-[#1A1A1A] bg-white p-4 sm:p-6">
          <h3 className="text-lg font-black text-[#1A1A1A]">Por que perdemos</h3>
          <p className="text-sm text-[#1A1A1A]/55">{plural(r.perdidos, 'perdido', 'perdidos')} em {nomeMes(mes)}</p>
          {r.alertaOutro && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#FFF0E6] px-3 py-2 text-sm font-bold text-[#B5540E]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              "Outro" passou de 20% das perdas. Vale anotar o motivo de verdade, ou criar um motivo novo.
            </p>
          )}
          <ul className="mt-4 grid gap-3">
            {r.porMotivo.length === 0 && <li className="text-sm font-bold text-[#1A1A1A]/40">Nenhuma perda neste mês.</li>}
            {r.porMotivo.map((m) => (
              <li key={m.motivo}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-black text-[#1A1A1A]">{m.motivo}</span>
                  <span className="shrink-0 font-bold tabular-nums text-[#1A1A1A]/60">
                    {m.qtd}
                    {m.valor > 0 && <> · {formatBRL(m.valor)}</>}
                  </span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-[#F0EAE3]">
                  <div className="h-3 rounded-full border-2 border-[#1A1A1A] bg-[#E97933]" style={{ width: `${(m.qtd / maxMotivo) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border-2 border-[#1A1A1A] bg-white p-4 sm:p-6">
          <h3 className="text-lg font-black text-[#1A1A1A]">Em que etapa perdemos</h3>
          <p className="text-sm text-[#1A1A1A]/55">Perder no começo é falta de contato; perder na proposta é preço ou proposta.</p>
          <ul className="mt-4 grid gap-3">
            {r.porEtapa.length === 0 && <li className="text-sm font-bold text-[#1A1A1A]/40">Nenhuma perda neste mês.</li>}
            {r.porEtapa.map((e) => (
              <li key={e.etapa}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-black text-[#1A1A1A]">{e.etapa}</span>
                  <span className="font-bold tabular-nums text-[#1A1A1A]/60">{e.qtd}</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-[#F0EAE3]">
                  <div className="h-3 rounded-full border-2 border-[#1A1A1A] bg-[#2D5F8A]" style={{ width: `${(e.qtd / maxEtapa) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
