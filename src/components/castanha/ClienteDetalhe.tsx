import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  cancelarContrato,
  mudarValorContrato,
  salvarCliente,
  salvarContrato,
} from '@/lib/castanha/dados.functions';
import { contratoAtivo, opcoesEncerramento, terminaEm, type Cliente, type Contrato } from '@/lib/castanha/negocio';
import { formatBRL, mesISO, montarMensagem, nomeMes, parseCentavos, somarMeses } from '@/lib/castanha/util';
import { BotaoWhatsapp } from './BotaoWhatsapp';
import { RegistrarContratoModal, resumoContrato } from './RegistrarContratoModal';
import { Botao, Campo, Erro, Modal, SelectMes, inputCls } from './ui';

type Acao =
  | { tipo: 'editar'; contrato: Contrato }
  | { tipo: 'novo' }
  | { tipo: 'mudar'; contrato: Contrato }
  | { tipo: 'encerrar'; contrato: Contrato }
  | { tipo: 'cancelar'; contrato: Contrato };

const erroTxt = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function ClienteDetalhe({
  cliente,
  contratos,
  adminNome,
  mensagemModelo,
  onAlterou,
  onClose,
}: {
  cliente: Cliente;
  contratos: Contrato[];
  adminNome: string;
  mensagemModelo: string;
  onAlterou: () => Promise<unknown> | void;
  onClose: () => void;
}) {
  const hoje = mesISO(Date.now());
  const meses = useMemo(() => Array.from({ length: 24 }, (_, i) => somarMeses(hoje, i - 6)), [hoje]);
  const [dados, setDados] = useState({ nome: cliente.nome, whatsapp: cliente.whatsapp, negocio: cliente.negocio, obs: cliente.obs });
  const [acao, setAcao] = useState<Acao | null>(null);
  const [mesAcao, setMesAcao] = useState(somarMeses(hoje, 1));
  const [valorAcao, setValorAcao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const alterouDados =
    dados.nome !== cliente.nome || dados.whatsapp !== cliente.whatsapp || dados.negocio !== cliente.negocio || dados.obs !== cliente.obs;

  async function executar(fn: () => Promise<unknown>, sucesso: string) {
    setSalvando(true);
    setErro('');
    try {
      await fn();
      await onAlterou();
      toast.success(sucesso);
      setAcao(null);
    } catch (e) {
      setErro(erroTxt(e));
    } finally {
      setSalvando(false);
    }
  }

  const ordenados = [...contratos].sort((a, b) => (terminaEm(b) > terminaEm(a) ? 1 : -1));

  if (acao?.tipo === 'editar' || acao?.tipo === 'novo') {
    return (
      <RegistrarContratoModal
        modo={acao.tipo === 'editar' ? 'editar' : 'novo-contrato'}
        clienteInicial={cliente}
        contratoInicial={acao.tipo === 'editar' ? acao.contrato : undefined}
        salvando={salvando}
        onAgoraNao={() => setAcao(null)}
        onRegistrar={(_, c) =>
          c &&
          void executar(
            () =>
              salvarContrato({
                data: {
                  ...c,
                  clienteId: cliente.clienteId,
                  obs: c.obs ?? '',
                  ...(acao.tipo === 'editar' ? { contratoId: acao.contrato.contratoId, encerradoEm: acao.contrato.encerradoEm } : {}),
                },
              }),
            acao.tipo === 'editar' ? 'Contrato atualizado.' : 'Contrato registrado.',
          )
        }
      />
    );
  }

  return (
    <Modal
      largura="lg"
      titulo={cliente.nome}
      subtitulo={`${cliente.origem === 'Manual' ? 'Cadastrado à mão' : `Veio de ${cliente.origem}`}${cliente.criadoEm ? ` · desde ${new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}` : ''}`}
      onClose={onClose}
    >
      <div className="grid gap-5">
        <BotaoWhatsapp
          numero={cliente.whatsapp}
          tamanho="grande"
          rotulo={`Chamar no WhatsApp · ${cliente.whatsapp}`}
          mensagem={montarMensagem(mensagemModelo, { nome: cliente.nome, admin: adminNome, precisa: '', negocio: cliente.negocio })}
        />

        <section className="grid gap-3 rounded-2xl bg-[#FFF8F2] p-4">
          <h4 className="font-black text-[#1A1A1A]">Dados do cliente</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Nome">
              <input className={inputCls} value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
            </Campo>
            <Campo rotulo="WhatsApp">
              <input className={inputCls} value={dados.whatsapp} inputMode="tel" onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })} />
            </Campo>
            <Campo rotulo="Negócio">
              <input className={inputCls} value={dados.negocio} onChange={(e) => setDados({ ...dados, negocio: e.target.value })} />
            </Campo>
          </div>
          <Campo rotulo="Observações">
            <textarea className={cn(inputCls, 'resize-y')} rows={2} value={dados.obs} onChange={(e) => setDados({ ...dados, obs: e.target.value })} />
          </Campo>
          {alterouDados && (
            <div className="flex justify-end">
              <Botao
                carregando={salvando}
                onClick={() =>
                  void executar(
                    () => salvarCliente({ data: { ...cliente, ...dados, clienteId: cliente.clienteId } }),
                    'Dados do cliente salvos.',
                  )
                }
              >
                Salvar dados
              </Botao>
            </div>
          )}
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-[#1A1A1A]">Contratos</h4>
            <Botao tipo="contorno" onClick={() => setAcao({ tipo: 'novo' })}>
              Novo contrato
            </Botao>
          </div>
          {ordenados.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 px-4 py-6 text-center text-sm font-bold text-[#1A1A1A]/45">
              Nenhum contrato ainda. Registre o primeiro para ele entrar na receita.
            </p>
          )}
          {ordenados.map((c) => {
            const ativo = contratoAtivo(c, hoje);
            const cancelado = /Cancelado em/.test(c.obs);
            const aberto = acao && 'contrato' in acao && acao.contrato.contratoId === c.contratoId ? acao : null;
            return (
              <article key={c.contratoId} className={cn('rounded-2xl border-2 p-4', ativo ? 'border-[#1A1A1A] bg-white' : 'border-[#1A1A1A]/15 bg-[#F0EAE3]/50')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-[#1A1A1A]">{c.servico}</p>
                    <p className="text-sm text-[#1A1A1A]/65">{resumoContrato(c)}</p>
                    {c.encerradoEm && !cancelado && <p className="text-xs font-bold text-[#B5540E]">Encerrado em {nomeMes(c.encerradoEm)}</p>}
                    {c.obs && <p className="mt-1 text-xs text-[#1A1A1A]/50">{c.obs}</p>}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black',
                      ativo ? 'bg-[#E3F4E8] text-[#1E8E3E]' : cancelado ? 'bg-[#FDECEA] text-[#B3261E]' : 'bg-[#F0EAE3] text-[#1A1A1A]/55',
                    )}
                  >
                    {ativo ? `Ativo até ${nomeMes(terminaEm(c))}` : cancelado ? 'Cancelado' : 'Encerrado'}
                  </span>
                </div>

                {ativo && !aberto && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Botao tipo="contorno" className="px-3 py-1.5 text-xs" onClick={() => setAcao({ tipo: 'editar', contrato: c })}>
                      Editar
                    </Botao>
                    {c.valorMensal > 0 && (
                      <Botao
                        tipo="contorno"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => {
                          setMesAcao(somarMeses(hoje, 1) > c.inicio ? somarMeses(hoje, 1) : somarMeses(c.inicio, 1));
                          setValorAcao(formatBRL(c.valorMensal));
                          setAcao({ tipo: 'mudar', contrato: c });
                        }}
                      >
                        Mudar valor a partir de…
                      </Botao>
                    )}
                    {opcoesEncerramento(c, hoje).opcoes.length > 0 && (
                      <Botao
                        tipo="contorno"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => {
                          setMesAcao(opcoesEncerramento(c, hoje).padrao);
                          setAcao({ tipo: 'encerrar', contrato: c });
                        }}
                      >
                        Encerrar antes
                      </Botao>
                    )}
                    <Botao tipo="fantasma" className="px-3 py-1.5 text-xs text-[#B3261E]" onClick={() => setAcao({ tipo: 'cancelar', contrato: c })}>
                      Cancelar
                    </Botao>
                  </div>
                )}

                {aberto?.tipo === 'mudar' && (
                  <div className="mt-3 grid gap-3 rounded-2xl bg-[#FFF8F2] p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <Campo rotulo="A partir de">
                      <SelectMes value={mesAcao} onChange={setMesAcao} meses={meses.filter((m) => m > c.inicio)} rotular={nomeMes} />
                    </Campo>
                    <Campo rotulo="Novo valor por mês">
                      <input className={inputCls} value={valorAcao} inputMode="decimal" onChange={(e) => setValorAcao(e.target.value)} />
                    </Campo>
                    <div className="flex gap-1.5">
                      <Botao tipo="fantasma" onClick={() => setAcao(null)}>Voltar</Botao>
                      <Botao
                        carregando={salvando}
                        onClick={() => {
                          const v = parseCentavos(valorAcao);
                          if (!v) return setErro('Informe o novo valor.');
                          void executar(() => mudarValorContrato({ data: { contratoId: c.contratoId, aPartirDe: mesAcao, valorMensal: v } }), 'Valor atualizado.');
                        }}
                      >
                        Aplicar
                      </Botao>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/55 sm:col-span-3">Os meses antes de {nomeMes(mesAcao)} continuam com o valor antigo.</p>
                  </div>
                )}

                {aberto?.tipo === 'encerrar' && (
                  <div className="mt-3 grid gap-3 rounded-2xl bg-[#FFF8F2] p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <Campo rotulo="Último mês que conta" dica="O contrato para de entrar na receita depois deste mês.">
                      <SelectMes value={mesAcao} onChange={setMesAcao} meses={opcoesEncerramento(c, hoje).opcoes} rotular={nomeMes} />
                    </Campo>
                    <div className="flex gap-1.5">
                      <Botao tipo="fantasma" onClick={() => setAcao(null)}>Voltar</Botao>
                      <Botao
                        carregando={salvando}
                        onClick={() =>
                          void executar(
                            () => salvarContrato({ data: { ...c, encerradoEm: somarMeses(mesAcao, 1) } }),
                            `Contrato vale até ${nomeMes(mesAcao)}.`,
                          )
                        }
                      >
                        Encerrar
                      </Botao>
                    </div>
                  </div>
                )}

                {aberto?.tipo === 'cancelar' && (
                  <div className="mt-3 grid gap-2 rounded-2xl bg-[#FDECEA] p-3">
                    <p className="text-sm font-bold text-[#B3261E]">Cancelar tira este contrato da receita em todos os meses. Use quando a venda não aconteceu.</p>
                    <div className="flex justify-end gap-1.5">
                      <Botao tipo="fantasma" onClick={() => setAcao(null)}>Voltar</Botao>
                      <Botao tipo="perigo" carregando={salvando} onClick={() => void executar(() => cancelarContrato({ data: { contratoId: c.contratoId } }), 'Contrato cancelado.')}>
                        Cancelar contrato
                      </Botao>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
        <Erro>{erro}</Erro>
      </div>
    </Modal>
  );
}
