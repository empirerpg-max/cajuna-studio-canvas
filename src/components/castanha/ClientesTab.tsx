import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { registrarGanho } from '@/lib/castanha/dados.functions';
import {
  contratoAtivo,
  garantidoDepois,
  recorrenteNoMes,
  terminaEm,
  type Cliente,
  type Contrato,
  type DadosCastanha,
} from '@/lib/castanha/negocio';
import { formatBRL, mesISO, montarMensagem, nomeMes, plural, somarMeses } from '@/lib/castanha/util';
import { BotaoWhatsapp } from './BotaoWhatsapp';
import { ClienteDetalhe } from './ClienteDetalhe';
import { RegistrarContratoModal } from './RegistrarContratoModal';
import { inputCls } from './ui';

type Filtro = 'ativos' | 'encerrados' | 'todos';

type Linha = {
  cliente: Cliente;
  contratos: Contrato[];
  ativos: Contrato[];
  mensal: number;
  termina: string;
  total: number;
  acabando: boolean;
};

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function ClientesTab({
  dados,
  carregando,
  erro,
  adminNome,
  mensagemModelo,
  onRecarregar,
}: {
  dados: DadosCastanha | undefined;
  carregando: boolean;
  erro: string;
  adminNome: string;
  mensagemModelo: string;
  onRecarregar: () => Promise<unknown>;
}) {
  const hoje = mesISO(Date.now());
  const [filtro, setFiltro] = useState<Filtro>('ativos');
  const [busca, setBusca] = useState('');
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const linhas = useMemo<Linha[]>(() => {
    if (!dados) return [];
    return dados.clientes
      .map((cliente) => {
        const contratos = dados.contratos.filter((c) => c.clienteId === cliente.clienteId);
        const ativos = contratos.filter((c) => contratoAtivo(c, hoje));
        const termina = ativos.map(terminaEm).sort().at(-1) ?? '';
        return {
          cliente,
          contratos,
          ativos,
          mensal: ativos.reduce((s, c) => s + recorrenteNoMes(c, hoje), 0),
          termina,
          total: garantidoDepois(contratos, '0000-00'),
          acabando: !!termina && termina <= somarMeses(hoje, 1),
        };
      })
      .sort((a, b) => b.mensal - a.mensal || a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'));
  }, [dados, hoje]);

  const visiveis = linhas.filter((l) => {
    if (filtro === 'ativos' && l.ativos.length === 0) return false;
    if (filtro === 'encerrados' && l.ativos.length > 0) return false;
    return !busca.trim() || semAcento(l.cliente.nome).includes(semAcento(busca.trim()));
  });
  const totalMensal = linhas.reduce((s, l) => s + l.mensal, 0);
  const acabando = linhas.filter((l) => l.acabando).length;
  const aberto = linhas.find((l) => l.cliente.clienteId === abertoId);

  return (
    <div className="px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto grid max-w-[1100px] gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">Clientes</h2>
            <p className="text-sm font-medium text-[#1A1A1A]/55">
              {plural(linhas.filter((l) => l.ativos.length).length, 'cliente ativo', 'clientes ativos')} ·{' '}
              {formatBRL(totalMensal)} em mensalidades em {nomeMes(hoje)}
              {acabando > 0 && <span className="font-black text-[#B5540E]"> · {plural(acabando, 'contrato termina', 'contratos terminam')} em até 30 dias</span>}
            </p>
          </div>
          <button
            onClick={() => setNovo(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2.5 font-black text-[#1A1A1A] transition hover:bg-[#d4692a]"
          >
            <Plus size={17} /> Novo cliente
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border-2 border-[#1A1A1A] bg-white p-0.5" role="group" aria-label="Filtrar clientes">
            {(['ativos', 'encerrados', 'todos'] as const).map((f) => (
              <button
                key={f}
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                className={cn('rounded-full px-4 py-1.5 text-sm font-black capitalize transition', filtro === f ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60')}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente" aria-label="Buscar cliente" className={cn(inputCls, 'py-2 pl-9')} />
          </label>
        </div>

        {carregando ? (
          <div className="flex justify-center py-20 text-[#1A1A1A]/40">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : erro && !dados ? (
          <div className="mx-auto max-w-lg rounded-3xl border-2 border-[#1A1A1A] bg-white p-6 text-center">
            <p className="font-black">Não foi possível carregar os clientes</p>
            <p className="mt-1 text-sm text-[#1A1A1A]/60">{erro}</p>
            <button onClick={() => void onRecarregar()} className="mt-4 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2 font-black">
              Tentar de novo
            </button>
          </div>
        ) : visiveis.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-[#1A1A1A]/15 px-4 py-14 text-center font-bold text-[#1A1A1A]/45">
            {linhas.length === 0
              ? 'Nenhum cliente ainda. Eles aparecem aqui quando um card vai para Ganho ou Fechado, ou pelo botão "Novo cliente".'
              : 'Nenhum cliente com esse filtro.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-3xl border-2 border-[#1A1A1A] bg-white">
            <div className="hidden grid-cols-[2fr_1.4fr_1fr_0.8fr_1fr_auto] gap-3 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 text-xs font-black text-white md:grid">
              <span>Cliente</span>
              <span>Serviços ativos</span>
              <span className="text-right">Mensal em {nomeMes(hoje)}</span>
              <span>Termina</span>
              <span className="text-right">Total contratado</span>
              <span className="w-[92px]" />
            </div>
            <ul>
              {visiveis.map((l, i) => (
                <li key={l.cliente.clienteId} className={cn(i > 0 && 'border-t-2 border-[#1A1A1A]/10')}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setAbertoId(l.cliente.clienteId)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setAbertoId(l.cliente.clienteId))}
                    className="grid cursor-pointer gap-1 px-4 py-4 transition hover:bg-[#FFF8F2] focus:outline-none focus-visible:bg-[#FFF8F2] md:grid-cols-[2fr_1.4fr_1fr_0.8fr_1fr_auto] md:items-center md:gap-3 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#1A1A1A]">{l.cliente.nome}</p>
                      <p className="truncate text-xs text-[#1A1A1A]/50">
                        {l.cliente.negocio || (l.cliente.origem === 'Manual' ? 'Cadastrado à mão' : l.cliente.origem)}
                      </p>
                    </div>
                    <p className="min-w-0 truncate text-sm text-[#1A1A1A]/70">
                      {l.ativos.map((c) => c.servico).join(', ') || <span className="text-[#1A1A1A]/35">sem contrato ativo</span>}
                    </p>
                    <p className="text-sm font-black tabular-nums text-[#1A1A1A] md:text-right">
                      <span className="font-medium text-[#1A1A1A]/50 md:hidden">Mensal: </span>
                      {l.mensal ? formatBRL(l.mensal) : '—'}
                    </p>
                    <p className="text-sm">
                      {l.termina ? (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-black', l.acabando ? 'bg-[#FFF0E6] text-[#B5540E]' : 'bg-[#F0EAE3] text-[#1A1A1A]/65')}>
                          {l.acabando ? `Termina ${nomeMes(l.termina)}` : `até ${nomeMes(l.termina)}`}
                        </span>
                      ) : (
                        <span className="text-xs text-[#1A1A1A]/35">—</span>
                      )}
                    </p>
                    <p className="text-sm tabular-nums text-[#1A1A1A]/70 md:text-right">
                      <span className="text-[#1A1A1A]/50 md:hidden">Total contratado: </span>
                      {l.total ? formatBRL(l.total) : '—'}
                    </p>
                    <div className="mt-1 md:mt-0 md:w-[92px]">
                      <BotaoWhatsapp
                        numero={l.cliente.whatsapp}
                        mensagem={montarMensagem(mensagemModelo, { nome: l.cliente.nome, admin: adminNome, precisa: '', negocio: l.cliente.negocio })}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {aberto && (
        <ClienteDetalhe
          key={aberto.cliente.clienteId}
          cliente={aberto.cliente}
          contratos={aberto.contratos}
          adminNome={adminNome}
          mensagemModelo={mensagemModelo}
          onAlterou={onRecarregar}
          onClose={() => setAbertoId(null)}
        />
      )}

      {novo && (
        <RegistrarContratoModal
          modo="manual"
          clienteInicial={{ origem: 'Manual' }}
          salvando={salvando}
          onAgoraNao={() => setNovo(false)}
          onRegistrar={async (cliente, contrato) => {
            setSalvando(true);
            try {
              await registrarGanho({
                data: {
                  cliente: { nome: cliente.nome ?? '', whatsapp: cliente.whatsapp ?? '', negocio: cliente.negocio ?? '', origem: 'Manual', cardId: '', funil: '', obs: '' },
                  contrato: contrato ? { ...contrato, clienteId: '', obs: contrato.obs ?? '' } : null,
                  movimento: null,
                },
              });
              await onRecarregar();
              toast.success('Cliente cadastrado.');
              setNovo(false);
            } catch (e) {
              toast.error(`Não foi possível cadastrar: ${e instanceof Error ? e.message : e}`);
            } finally {
              setSalvando(false);
            }
          }}
        />
      )}
    </div>
  );
}
