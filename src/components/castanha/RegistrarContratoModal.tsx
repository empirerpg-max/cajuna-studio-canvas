import { useMemo, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validarContrato,
  terminaEm,
  type Cliente,
  type Contrato,
} from '@/lib/castanha/negocio';
import { formatBRL, mesISO, nomeMes, parseCentavos, somarMeses } from '@/lib/castanha/util';
import { Botao, Campo, Erro, Modal, SelectMes, inputCls } from './ui';

export type NovoContrato = Pick<
  Contrato,
  'servico' | 'valorMensal' | 'meses' | 'inicio' | 'valorUnico' | 'mesValorUnico' | 'obs'
> & { contratoId?: string; clienteId?: string };

function descreverContrato(c: Pick<Contrato, 'valorMensal' | 'meses' | 'inicio' | 'valorUnico' | 'mesValorUnico'>) {
  const partes: string[] = [];
  if (c.valorMensal > 0 && c.meses > 0 && c.inicio) {
    const fim = somarMeses(c.inicio, c.meses - 1);
    partes.push(
      `${formatBRL(c.valorMensal)}/mês de ${nomeMes(c.inicio)} a ${nomeMes(fim)} · total ${formatBRL(c.valorMensal * c.meses)}`,
    );
  }
  if (c.valorUnico > 0 && c.mesValorUnico) partes.push(`${formatBRL(c.valorUnico)} em ${nomeMes(c.mesValorUnico)}`);
  return partes;
}

export function resumoContrato(c: Contrato) {
  const partes = descreverContrato(c);
  const t = terminaEm(c);
  return partes.length ? partes.join(' + ') : t ? `até ${nomeMes(t)}` : 'sem valores';
}

/**
 * Registrar um contrato: ao ganhar uma venda (modo "ganho"), ao criar um cliente à mão (modo "manual")
 * ou ao editar um contrato existente (modo "editar").
 */
export function RegistrarContratoModal({
  modo,
  clienteInicial,
  contratoInicial,
  contratoExistente,
  salvando,
  onRegistrar,
  onAgoraNao,
}: {
  modo: 'ganho' | 'manual' | 'novo-contrato' | 'editar';
  clienteInicial: Partial<Cliente>;
  contratoInicial?: Partial<Contrato>;
  /** Contrato ativo que o card já tem (ganho repetido). */
  contratoExistente?: Contrato;
  salvando: boolean;
  onRegistrar: (cliente: Partial<Cliente>, contrato: NovoContrato | null) => void;
  onAgoraNao: () => void;
}) {
  const hoje = mesISO(Date.now());
  const meses = useMemo(() => Array.from({ length: 20 }, (_, i) => somarMeses(hoje, i - 6)), [hoje]);
  const [manter, setManter] = useState(!!contratoExistente);
  const [cliente, setCliente] = useState({
    nome: clienteInicial.nome ?? '',
    whatsapp: clienteInicial.whatsapp ?? '',
    negocio: clienteInicial.negocio ?? '',
  });
  const ci = contratoInicial;
  const [servico, setServico] = useState(ci?.servico ?? '');
  // Sem valores informados, começa com "Mensalidade" marcada (o caso mais comum).
  const [temRec, setTemRec] = useState(ci?.valorMensal !== undefined || ci?.valorUnico !== undefined ? (ci?.valorMensal ?? 0) > 0 : true);
  const [temUni, setTemUni] = useState((ci?.valorUnico ?? 0) > 0);
  const [valorMensal, setValorMensal] = useState(ci?.valorMensal ? formatBRL(ci.valorMensal) : '');
  const [qtdMeses, setQtdMeses] = useState(ci?.meses || 4);
  const [inicio, setInicio] = useState(ci?.inicio || somarMeses(hoje, 1));
  const [valorUnico, setValorUnico] = useState(ci?.valorUnico ? formatBRL(ci.valorUnico) : '');
  const [mesUnico, setMesUnico] = useState(ci?.mesValorUnico || hoje);
  const [obs, setObs] = useState(ci?.obs ?? '');
  const [erro, setErro] = useState('');

  const contrato: NovoContrato = {
    contratoId: ci?.contratoId,
    clienteId: ci?.clienteId,
    servico,
    valorMensal: temRec ? (parseCentavos(valorMensal) ?? 0) : 0,
    meses: temRec ? qtdMeses : 0,
    inicio: temRec ? inicio : '',
    valorUnico: temUni ? (parseCentavos(valorUnico) ?? 0) : 0,
    mesValorUnico: temUni ? mesUnico : '',
    obs,
  };
  const previa = descreverContrato(contrato);
  const editaCliente = modo === 'manual' || modo === 'ganho';

  function registrar() {
    if (manter) return onAgoraNao();
    if (editaCliente && !cliente.nome.trim()) return setErro('Informe o nome do cliente.');
    const msg = validarContrato(contrato);
    if (msg) return setErro(msg);
    setErro('');
    onRegistrar({ ...clienteInicial, ...cliente }, contrato);
  }

  const titulo =
    modo === 'ganho' ? 'Venda fechada!' : modo === 'manual' ? 'Novo cliente' : modo === 'editar' ? 'Editar contrato' : 'Novo contrato';
  const subtitulo =
    modo === 'ganho'
      ? `Registre o contrato de ${clienteInicial.nome || 'cliente'} para ele entrar na receita.`
      : modo === 'manual'
        ? 'Cliente que não passou pelos funis.'
        : clienteInicial.nome;

  return (
    <Modal
      titulo={titulo}
      subtitulo={subtitulo}
      onClose={onAgoraNao}
      rodape={
        <>
          {modo === 'ganho' && !manter && (
            <Botao tipo="fantasma" onClick={onAgoraNao}>
              Registrar depois
            </Botao>
          )}
          {modo === 'manual' && (
            <Botao
              tipo="fantasma"
              onClick={() => {
                if (!cliente.nome.trim()) return setErro('Informe o nome do cliente.');
                onRegistrar({ ...clienteInicial, ...cliente }, null);
              }}
            >
              Salvar sem contrato
            </Botao>
          )}
          <Botao onClick={registrar} carregando={salvando}>
            {manter ? 'Concluir' : modo === 'editar' ? 'Salvar alterações' : 'Registrar contrato'}
          </Botao>
        </>
      }
    >
      <div className="grid gap-4">
        {contratoExistente && (
          <div className="grid gap-2">
            {[
              { v: true, t: 'Manter o contrato atual', d: `${contratoExistente.servico} · ${resumoContrato(contratoExistente)}` },
              { v: false, t: 'Registrar outro contrato', d: 'Um serviço novo para o mesmo cliente.' },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => setManter(o.v)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition',
                  manter === o.v ? 'border-[#1A1A1A] bg-[#FFF8F2]' : 'border-[#1A1A1A]/15',
                )}
              >
                <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A1A]', manter === o.v && 'bg-[#E97933]')}>
                  {manter === o.v && <Check size={12} strokeWidth={3} />}
                </span>
                <span>
                  <span className="block font-black">{o.t}</span>
                  <span className="block text-sm text-[#1A1A1A]/60">{o.d}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {!manter && (
          <>
            {editaCliente && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Campo rotulo="Cliente">
                    <input className={inputCls} value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} maxLength={200} />
                  </Campo>
                </div>
                <Campo rotulo="WhatsApp">
                  <input className={inputCls} value={cliente.whatsapp} inputMode="tel" onChange={(e) => setCliente({ ...cliente, whatsapp: e.target.value })} placeholder="+55 68 99985-2899" />
                </Campo>
                <Campo rotulo="Negócio">
                  <input className={inputCls} value={cliente.negocio} onChange={(e) => setCliente({ ...cliente, negocio: e.target.value })} placeholder="Ex.: confeitaria" />
                </Campo>
              </div>
            )}

            <Campo rotulo="Serviço contratado">
              <input className={inputCls} value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Ex.: Gestão de redes sociais" maxLength={200} />
            </Campo>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { on: temRec, set: setTemRec, t: 'Mensalidade', d: 'Entra todo mês, por alguns meses' },
                { on: temUni, set: setTemUni, t: 'Valor único', d: 'Entra uma vez só' },
              ].map((o) => (
                <button
                  key={o.t}
                  type="button"
                  aria-pressed={o.on}
                  onClick={() => o.set(!o.on)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition',
                    o.on ? 'border-[#1A1A1A] bg-[#FFF0E6]' : 'border-[#1A1A1A]/15 bg-white',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#1A1A1A]', o.on && 'bg-[#E97933]')}>
                    {o.on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block font-black">{o.t}</span>
                    <span className="block text-xs text-[#1A1A1A]/55">{o.d}</span>
                  </span>
                </button>
              ))}
            </div>

            {temRec && (
              <div className="grid gap-3 rounded-2xl bg-[#FFF8F2] p-3 sm:grid-cols-[1fr_150px_1fr]">
                <Campo rotulo="Valor por mês">
                  <input className={inputCls} value={valorMensal} inputMode="decimal" onChange={(e) => setValorMensal(e.target.value)} onBlur={() => { const c = parseCentavos(valorMensal); if (c) setValorMensal(formatBRL(c)); }} placeholder="R$ 1.200,00" />
                </Campo>
                <Campo rotulo="Meses">
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Menos um mês" onClick={() => setQtdMeses((m) => Math.max(1, m - 1))} className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1A1A1A]/15 bg-white hover:border-[#1A1A1A]">
                      <Minus size={15} />
                    </button>
                    <input className={cn(inputCls, 'min-w-0 px-1 text-center')} type="number" min={1} max={60} value={qtdMeses} onChange={(e) => setQtdMeses(Math.max(1, Math.min(60, Math.round(Number(e.target.value) || 1))))} />
                    <button type="button" aria-label="Mais um mês" onClick={() => setQtdMeses((m) => Math.min(60, m + 1))} className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1A1A1A]/15 bg-white hover:border-[#1A1A1A]">
                      <Plus size={15} />
                    </button>
                  </div>
                </Campo>
                <Campo rotulo="Primeiro mês">
                  <SelectMes value={inicio} onChange={setInicio} meses={meses} rotular={nomeMes} />
                </Campo>
              </div>
            )}

            {temUni && (
              <div className="grid gap-3 rounded-2xl bg-[#EAF1F8] p-3 sm:grid-cols-2">
                <Campo rotulo="Valor">
                  <input className={inputCls} value={valorUnico} inputMode="decimal" onChange={(e) => setValorUnico(e.target.value)} onBlur={() => { const c = parseCentavos(valorUnico); if (c) setValorUnico(formatBRL(c)); }} placeholder="R$ 3.500,00" />
                </Campo>
                <Campo rotulo="Mês em que entra">
                  <SelectMes value={mesUnico} onChange={setMesUnico} meses={meses} rotular={nomeMes} />
                </Campo>
              </div>
            )}

            <Campo rotulo="Observação (opcional)">
              <input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} maxLength={2000} />
            </Campo>

            <div className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/20 px-4 py-3">
              <p className="text-xs font-black text-[#1A1A1A]/50">Vai entrar na receita</p>
              {previa.length ? (
                previa.map((p) => (
                  <p key={p} className="font-black text-[#1A1A1A]">
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-sm font-medium text-[#1A1A1A]/50">Preencha os valores para ver a prévia.</p>
              )}
            </div>
          </>
        )}

        <Erro>{erro}</Erro>
      </div>
    </Modal>
  );
}
